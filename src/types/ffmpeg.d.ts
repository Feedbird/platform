declare module '@ffmpeg/ffmpeg' {
  export function createFFmpeg(options?: any): any;
  export function fetchFile(input: any): Promise<Uint8Array>;
}

declare module '@ffmpeg/ffmpeg/dist/ffmpeg.js' {
  export function createFFmpeg(options?: any): any;
  export function fetchFile(input: any): Promise<Uint8Array>;
}

declare module '@ffmpeg/ffmpeg/dist/ffmpeg.min.js' {
  export function createFFmpeg(options?: any): any;
  export function fetchFile(input: any): Promise<Uint8Array>;
}


