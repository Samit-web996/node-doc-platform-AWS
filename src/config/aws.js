const { S3Client } = require('@aws-sdk/client-s3');
const { SNSClient } = require('@aws-sdk/client-sns');

const region = process.env.AWS_REGION || 'ap-south-1';

const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });

module.exports = { s3Client, snsClient };