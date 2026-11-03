import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = process.env.S3_REGION || (endpoint.includes("r2.cloudflarestorage.com") ? "auto" : "us-east-1");

const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "recruitment-bucket";

/**
 * Check whether S3 / Cloudflare R2 storage is explicitly configured via environment variables.
 */
export function isS3Configured(): boolean {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

function isLocalMinioEndpoint(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("//minio:")
  );
}

/**
 * Only attempt auto-bucket creation on local MinIO.
 * On Cloudflare R2, object-scoped tokens do not need (and should not have) CreateBucket admin permissions.
 */
async function ensureBucketExists() {
  if (!isLocalMinioEndpoint(endpoint)) {
    return;
  }
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
    } else {
      throw error;
    }
  }
}

export async function getPresignedUploadUrl(objectKey: string, contentType: string) {
  await ensureBucketExists();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export async function uploadBufferToS3(
  objectKey: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await ensureBucketExists();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
}

export async function getPresignedDownloadUrl(objectKey: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export async function deleteS3Object(objectKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });
  await s3Client.send(command);
}
