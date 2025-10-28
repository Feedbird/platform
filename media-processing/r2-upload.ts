import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Public URL is optional; if absent we build one from endpoint + bucket.
let R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (
  !R2_ENDPOINT ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME
) {
  throw new Error("Missing required R2 environment variables");
}

if (!R2_PUBLIC_URL) {
  // Remove any trailing slash from endpoint.
  const endpointClean = R2_ENDPOINT.replace(/\/$/, "");
  R2_PUBLIC_URL = `${endpointClean}/${R2_BUCKET_NAME}`;
  console.warn(
    `[R2 UPLOAD] R2_PUBLIC_URL was not set. Falling back to ${R2_PUBLIC_URL}`
  );
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to Cloudflare R2 and returns the public URL.
 * @param filePath The local path to the file to upload.
 * @param fileNameOptional An optional file name for the uploaded file. If not provided, the original file name is used.
 * @returns The public URL of the uploaded file.
 */
export async function uploadToR2(
  filePath: string,
  fileNameOptional?: string
): Promise<string> {
  const fileName = fileNameOptional || path.basename(filePath);
  console.log(`[R2 UPLOAD] Starting upload for: ${fileName}`);
  console.log(`[R2 UPLOAD] Target Bucket: ${R2_BUCKET_NAME}`);
  console.log(`[R2 UPLOAD] Target Endpoint: ${R2_ENDPOINT}`);

  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
  });

  try {
    console.log(`[R2 UPLOAD] Sending PutObjectCommand for key: ${fileName}`);
    await r2Client.send(command);
    let finalUrl: string;
    if (R2_PUBLIC_URL) {
      finalUrl = `${R2_PUBLIC_URL}/${fileName}`;
    } else {
      // Generate a signed URL valid for 7 days (max allowed by AWS SDK presigner)
      const signed = await getSignedUrl(
        r2Client,
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
        }),
        { expiresIn: 60 * 60 * 24 * 7 }
      );
      finalUrl = signed;
    }
    console.log(`[R2 UPLOAD] ✅ Successfully uploaded to R2. URL: ${finalUrl}`);
    return finalUrl;
  } catch (error) {
    console.error("[R2 UPLOAD] ❌ Error uploading to R2:", error);
    throw error;
  } finally {
    // Clean up the local file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(
          `[R2 UPLOAD] ❌ Failed to delete temporary file: ${filePath}`,
          err
        );
      } else {
        console.log(`[R2 UPLOAD] ✅ Deleted temporary file: ${filePath}`);
      }
    });
  }
}

/**
 * Deletes an object from Cloudflare R2 by key or full URL.
 */
export async function deleteFromR2ByKeyOrUrl(keyOrUrl: string): Promise<void> {
  // Derive key from public URL if necessary
  let key = keyOrUrl;
  if (keyOrUrl.startsWith("http")) {
    const possiblePrefixes: string[] = [];
    if (R2_PUBLIC_URL) possiblePrefixes.push(R2_PUBLIC_URL.replace(/\/$/, "") + "/");
    // Also consider endpoint/bucket form
    possiblePrefixes.push(`${R2_ENDPOINT?.replace(/\/$/, "")}/${R2_BUCKET_NAME}/`);
    const match = possiblePrefixes.find((p) => keyOrUrl.startsWith(p));
    if (match) {
      key = keyOrUrl.substring(match.length);
    }
  }
  if (!key) throw new Error("Missing R2 object key");

  const cmd = new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key });
  await r2Client.send(cmd);
}

/**
 * Generates a pre-signed URL for uploading a file directly to R2 from the client.
 * @param fileName The name of the file.
 * @param fileType The MIME type of the file.
 * @param wid Workspace ID (tenant key - always required).
 * @param resources Array of resource objects that build the path structure.
 * @returns An object containing the upload URL and the final public URL of the object.
 */
export async function getSignedUploadUrl({
  fileName,
  fileType,
  wid,
  resources = [],
}: {
  fileName: string;
  fileType: string;
  wid: string;
  resources?: Array<{ type: string; id?: string }>; // e.g., [{ type: "forms", id: "123" }, { type: "fields" }]
}) {
  console.log(
    `[R2 UPLOAD] Requesting signed URL for: ${fileName} (${fileType})`
  );

  const unique = crypto.randomUUID();
  const baseName = path.basename(fileName);

  // Build path: workspace-{wid}/resource1-{id1}/resource2-{id2}/...
  const pathParts = [`workspace-${wid}`];

  for (const resource of resources) {
    if (resource.id) {
      pathParts.push(`${resource.type}-${resource.id}`);
    } else {
      pathParts.push(resource.type);
    }
  }

  const prefix =
    pathParts.length > 1 ? pathParts.join("/") + "/" : `workspace-${wid}/`;
  const key = `${prefix}${unique}-${baseName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    }); // 1 hour
    console.log(
      `[R2 UPLOAD] ✅ Successfully created signed URL for key: ${key}`
    );

    let publicUrl: string;
    if (R2_PUBLIC_URL) {
      publicUrl = `${R2_PUBLIC_URL}/${key}`;
    } else {
      // This fallback is less ideal for client-side uploads as it generates another signed URL
      // for viewing, which might not be what's needed. A public URL is preferred.
      publicUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
    }

    return {
      uploadUrl,
      publicUrl,
    };
  } catch (error) {
    console.error("[R2 UPLOAD] ❌ Error creating signed URL:", error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getSignedUploadUrl with resources array instead
 */
export async function getSignedUploadUrlLegacy({
  fileName,
  fileType,
  wid,
  boardId,
  pid,
  cid,
}: {
  fileName: string;
  fileType: string;
  wid: string;
  boardId?: string | null;
  pid?: string | null;
  cid?: string | null;
}) {
  const resources = [];
  if (boardId) resources.push({ type: "board", id: boardId });
  if (pid) resources.push({ type: "post", id: pid });
  if (cid) resources.push({ type: "column", id: cid });

  return getSignedUploadUrl({ fileName, fileType, wid, resources });
}
