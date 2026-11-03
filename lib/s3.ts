import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region =
  process.env.S3_REGION ||
  (endpoint.includes("r2.cloudflarestorage.com") ? "auto" : "us-east-1");

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
 * Check whether a real S3 / Cloudflare R2 storage endpoint is configured.
 * Returns false if using the default unconfigured localhost:9000 + minioadmin placeholder
 * (unless FORCE_LOCAL_MINIO=true is explicitly set).
 */
export function isS3Configured(): boolean {
  const ep = process.env.S3_ENDPOINT;
  const ak = process.env.S3_ACCESS_KEY;
  const sk = process.env.S3_SECRET_KEY;
  if (!ep || !ak || !sk) return false;

  const isDefaultPlaceholder =
    (ep === "http://localhost:9000" || ep === "http://127.0.0.1:9000") &&
    ak === "minioadmin" &&
    sk === "minioadmin" &&
    process.env.FORCE_LOCAL_MINIO !== "true";

  return !isDefaultPlaceholder;
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

export async function getPresignedUploadUrl(
  objectKey: string,
  contentType: string
) {
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

export async function headS3Object(objectKey: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function getObjectFromS3(
  objectKey: string
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
      })
    );
    if (!response.Body) return null;
    const byteArray = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(byteArray),
      contentType: response.ContentType,
    };
  } catch (error: any) {
    if (
      error?.name === "NoSuchKey" ||
      error?.name === "NotFound" ||
      error?.$metadata?.httpStatusCode === 404
    ) {
      return null;
    }
    throw error;
  }
}

export async function getPresignedDownloadUrl(objectKey: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    ResponseContentDisposition: "inline",
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
