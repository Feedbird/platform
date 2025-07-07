import { Platform } from "../src/lib/social/platforms/platform-types";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";
import path from "path";
import { promisify } from "util";
import { uploadToR2 } from "./r2-upload";
import fs from "fs";
import ffprobeStatic from "ffprobe-static";

// Tell fluent-ffmpeg where to find FFmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Tell fluent-ffmpeg where to find FFprobe (needed for video metadata)
if (ffprobeStatic) {
  const probePath = (ffprobeStatic as any).path || (ffprobeStatic as unknown as string);
  ffmpeg.setFfprobePath(probePath);
}

const ffprobe = promisify<string, ffmpeg.FfprobeData>(ffmpeg.ffprobe);

const mediaConstraints: Record<string, any> = {
  facebook: {
    image: {
      maxWidth: 1200, maxHeight: 1350, aspectRatios: ["1.91:1", "1:1", "4:5"],
      maxSizeMb: 8, formats: ["jpg", "png"],
    },
    video: {
      maxWidth: 1280, maxHeight: 720, aspectRatios: ["16:9", "1:1", "4:5", "9:16"],
      maxSizeMb: 250, maxDurationSec: 14400, maxFps: 30, formats: ["mp4", "mov"],
      audio: { codecs: ["aac"], minBitrateKbps: 128 },
      video: { codecs: ["h264"] },
    },
  },
  instagram: {
    image: {
      maxWidth: 1080, maxHeight: 1350, aspectRatios: ["1:1", "4:5", "1.91:1"],
      maxSizeMb: 30, formats: ["jpg", "png"],
    },
    video: {
      maxWidth: 1080, maxHeight: 1920, aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
      maxSizeMb: 4000, maxDurationSec: 3600, maxFps: 30, formats: ["mp4", "mov"],
      audio: { codecs: ["aac"] },
      video: { codecs: ["h264"] },
    },
  },
  linkedin: {
      image: {
        maxWidth: 1200, maxHeight: 1200, aspectRatios: ["1:1", "1.91:1"],
        maxSizeMb: 8, formats: ["jpg", "png"],
      },
      video: {
        maxWidth: 4096, maxHeight: 2304, aspectRatios: ["16:9", "1:1", "9:16", "4:5"],
        maxSizeMb: 200, minDurationSec: 3, maxDurationSec: 600, maxFps: 60,
        formats: ["mp4", "mov"],
        audio: { codecs: ["aac", "mp3"] },
        video: { codecs: ["h264"] },
      },
  },
  pinterest: {
    image: {
        maxWidth: 1000, maxHeight: 1500, aspectRatios: ["2:3", "1:1"],
        maxSizeMb: 20, formats: ["png", "jpg"],
    },
    video: {
        maxWidth: 1080, maxHeight: 1920, aspectRatios: ["2:3", "9:16", "1:1", "4:5"],
        maxSizeMb: 2000, minDurationSec: 4, maxDurationSec: 900,
        formats: ["mp4", "mov", "m4v"],
        video: { codecs: ["h264", "h265"] },
    },
  },
  // ... other platforms can be added here
};

/**
 * Converts media (image or video) to be compliant with a specific platform's requirements.
 * This is a placeholder implementation.
 * 
 * @param sourcePath The local path to the source media file.
 * @param platform The target social media platform.
 * @param keyPrefix Optional key prefix for the uploaded file
 * @returns A promise that resolves with the path to the converted media file.
 */
export async function convertMediaForPlatform(
    sourcePath: string,
    platform: Platform,
    keyPrefix?: string
): Promise<string> {
    console.log(`Converting ${sourcePath} for ${platform}...`);

    const constraints = mediaConstraints[platform];
    if (!constraints) {
        console.warn(`No media constraints found for platform: ${platform}. Skipping conversion.`);
        // Even if no conversion, upload the original file to R2
        const fileName = keyPrefix ? `${keyPrefix}${path.basename(sourcePath)}` : undefined;
        return uploadToR2(sourcePath, fileName);
    }

    const fileExtension = path.extname(sourcePath).toLowerCase().substring(1);
    const isVideo = ['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm'].includes(fileExtension);
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension);

    const tempDir = path.dirname(sourcePath);
    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    
    let convertedPath: string | null = null;

    if (isVideo && constraints.video) {
        const videoConstraints = constraints.video;
        const metadata = await ffprobe(sourcePath);
        const videoStream = metadata.streams.find((s: ffmpeg.FfprobeStream) => s.codec_type === 'video');

        if (!videoStream) {
            throw new Error("No video stream found in the source file.");
        }

        let command = ffmpeg(sourcePath);
        
        // Handle format
        const outputFormat = videoConstraints.formats[0] || 'mp4';
        const tempConvertedPath = path.join(tempDir, `${baseName}-converted.${outputFormat}`);

        // Video Codec
        if (videoConstraints.video?.codecs?.length > 0) {
            command.videoCodec(videoConstraints.video.codecs[0]);
        }

        // Audio Codec
        if (videoConstraints.audio?.codecs?.length > 0) {
            command.audioCodec(videoConstraints.audio.codecs[0]);
        }

        // FPS
        if (videoConstraints.maxFps) {
            const currentFps = videoStream.r_frame_rate ? eval(videoStream.r_frame_rate) : 0;
            if (currentFps > videoConstraints.maxFps) {
                command.fps(videoConstraints.maxFps);
            }
        }
        
        // Duration
        if (videoConstraints.maxDurationSec) {
            const currentDuration = metadata.format.duration || 0;
            if (currentDuration > videoConstraints.maxDurationSec) {
                command.duration(videoConstraints.maxDurationSec);
            }
        }
        if (videoConstraints.minDurationSec) {
            const currentDuration = metadata.format.duration || 0;
            if (currentDuration < videoConstraints.minDurationSec) {
                // Not throwing error, just warning. The calling function should decide what to do.
                console.warn(`Video duration (${currentDuration}s) is less than the minimum required (${videoConstraints.minDurationSec}s) for ${platform}`);
            }
        }

        // Audio Bitrate
        if (videoConstraints.audio?.minBitrateKbps) {
            command.audioBitrate(videoConstraints.audio.minBitrateKbps);
        }

        // Size / Resolution
        const { maxWidth, maxHeight } = videoConstraints;
        if (maxWidth && maxHeight) {
            const width = videoStream.width || 0;
            const height = videoStream.height || 0;
            if(width > maxWidth || height > maxHeight){
                command.size(`${maxWidth}x${maxHeight}?`);
                // Use a complex filter for more precise scaling if needed
                // command.videoFilters(`scale=w=min(iw*1,${maxWidth}):h=min(ih*1,${maxHeight}):force_original_aspect_ratio=decrease,pad=${maxWidth}:${maxHeight}:(ow-iw)/2:(oh-ih)/2`);
            }
        }

        await new Promise<void>((resolve, reject) => {
            command
                .on('start', function(commandLine: string) {
                    console.log('Spawned Ffmpeg with command: ' + commandLine);
                })
                .on('end', () => {
                    console.log(`Conversion complete. Output: ${tempConvertedPath}`);
                    convertedPath = tempConvertedPath;
                    resolve();
                })
                .on('error', (err: Error) => {
                    console.error('Error during conversion:', err);
                    reject(err);
                })
                .save(tempConvertedPath);
        });

    } else if (isImage && constraints.image) {
        const imageConstraints = constraints.image;
        const tempConvertedPath = path.join(tempDir, `${baseName}-converted.${imageConstraints.formats[0] || 'jpg'}`);

        let image = sharp(sourcePath);
        const metadata = await image.metadata();

        const { maxWidth, maxHeight } = imageConstraints;
        if (maxWidth && maxHeight) {
            const width = metadata.width || 0;
            const height = metadata.height || 0;
            if (width > maxWidth || height > maxHeight) {
                image.resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });
            }
        }

        // Convert format and apply quality settings to manage size
        if (imageConstraints.formats && imageConstraints.formats[0]) {
            const format = imageConstraints.formats[0];
            if (format === 'png') {
                image.png({ quality: 80 });
            } else if (format === 'jpg' || format === 'jpeg') {
                image.jpeg({ quality: 80 });
            }
        }

        await image.toFile(tempConvertedPath);
        console.log(`Image conversion complete. Output: ${tempConvertedPath}`);
        convertedPath = tempConvertedPath;

    } else {
        console.log("File type not supported for conversion or no constraints for it.");
    }

    const finalPath = convertedPath || sourcePath;
    
    console.log(`[CONVERSION] Process complete. Starting R2 upload for: ${finalPath}`);
    const uploadKey = keyPrefix ? `${keyPrefix}${path.basename(finalPath)}` : undefined;
    const url = await uploadToR2(finalPath, uploadKey);

    // Clean up original file if a conversion happened and it's not the same file
    if (convertedPath && convertedPath !== sourcePath) {
        fs.unlink(sourcePath, (err) => {
            if (err) console.error(`Failed to delete original file: ${sourcePath}`, err);
            else console.log(`Deleted original file: ${sourcePath}`);
        });
    }

    return url;
} 