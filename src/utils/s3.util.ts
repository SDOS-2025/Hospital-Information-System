import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
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

/**
 * Upload file to S3
 * @param file File buffer
 * @param fileName Original file name
 * @param folderName Folder path in S3 (e.g., 'thesis', 'grievances')
 * @returns S3 file URL
 */
export const uploadFileToS3 = async (
  file: Buffer,
  fileName: string,
  folderName: string
): Promise<string> => {
  try {
    const uniqueFileName = generateUniqueFileName(fileName);
    const key = `${folderName}/${uniqueFileName}`;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: getContentType(fileName),
    };
    
    await s3Client.send(new PutObjectCommand(params));
    return key;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Get a presigned URL for an S3 object
 * @param key S3 object key
 * @param expiresIn URL expiration time in seconds (default: 3600)
 * @returns Presigned URL
 */
export const getPresignedUrl = async (
  key: string,
  expiresIn = 3600
): Promise<string> => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    
    const command = new GetObjectCommand(params);
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate file access URL');
  }
};

/**
 * Delete file from S3
 * @param key S3 object key
 */
export const deleteFileFromS3 = async (key: string): Promise<void> => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
    };
    
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from storage');
  }
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