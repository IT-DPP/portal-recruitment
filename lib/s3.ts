import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "recruitment-bucket";

async function ensureBucketExists() {
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

export async function getS3ObjectBuffer(objectKey: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });
    const response = await s3Client.send(command);
    if (!response.Body) return null;
    const byteArray = await response.Body.transformToByteArray();
    return {
      buffer: Buffer.from(byteArray),
      contentType: response.ContentType || "application/octet-stream",
    };
  } catch (error) {
    console.warn(`[S3] Error fetching object buffer for key '${objectKey}':`, error);
    return null;
  }
}
