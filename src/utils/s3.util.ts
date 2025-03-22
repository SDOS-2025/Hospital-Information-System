import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

const isTest = process.env.NODE_ENV === 'test';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  }
});

const bucketName = process.env.AWS_S3_BUCKET || 'hospital-documents';

/**
 * Generate a unique filename to avoid collisions in S3 bucket
 */
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const fileExtension = path.extname(originalName);
  const sanitizedFileName = path.basename(originalName, fileExtension)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase();
  
  return `${sanitizedFileName}-${timestamp}-${randomString}${fileExtension}`;
};

// Mock implementations for testing
const mockUploadToS3 = async (fileBuffer: Buffer, fileName: string, folder: string): Promise<string> => {
  const key = `${folder}/${Date.now()}-${fileName}`;
  return key;
};

const mockGetPresignedUrl = async (key: string): Promise<string> => {
  return `https://mock-s3-url.com/${key}`;
};

const mockDeleteFromS3 = async (key: string): Promise<void> => {
  return;
};

// Export real or mock functions based on environment
export const uploadFileToS3 = isTest ? mockUploadToS3 : async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string
): Promise<string> => {
  const key = `${folder}/${Date.now()}-${fileName}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: fileBuffer
  }));

  return key;
};

export const getPresignedUrl = isTest ? mockGetPresignedUrl : async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

export const deleteFileFromS3 = isTest ? mockDeleteFromS3 : async (key: string): Promise<void> => {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  }));
};

/**
 * Get content type based on file extension
 */
const getContentType = (fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

// Export s3Client for health checks
export { s3Client as S3 };