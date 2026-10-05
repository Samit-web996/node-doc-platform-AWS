const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/aws');

const uploadToS3 = async (key, buffer, mimeType) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256'
  });
  return await s3Client.send(command);
};

const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  });
  return await s3Client.send(command);
};

const generatePresignedUrl = async (key, fileName, mimeType) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ResponseContentType: mimeType || 'application/octet-stream',
    ResponseContentDisposition: `attachment; filename="${fileName || 'download'}"`
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 900 });
};

module.exports = { uploadToS3, deleteFromS3, generatePresignedUrl };