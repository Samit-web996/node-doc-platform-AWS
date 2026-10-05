const { PublishCommand } = require('@aws-sdk/client-sns');
const { snsClient } = require('../config/aws');
const logger = require('../config/logger');

const publishUploadEvent = async (eventData) => {
  try {
    const payload = {
      eventType: 'DOCUMENT_UPLOADED',
      eventId: eventData.eventId,
      userId: eventData.userId,
      objectKey: eventData.objectKey,
      bucket: process.env.AWS_S3_BUCKET,
      fileName: eventData.fileName,
      timestamp: new Date().toISOString()
    };

    const command = new PublishCommand({
      TopicArn: process.env.AWS_SNS_TOPIC_ARN,
      Message: JSON.stringify(payload),
      Subject: 'New Document Uploaded'
    });

    await snsClient.send(command);
    logger.info({ message: 'SNS Event Published', eventId: eventData.eventId });
  } catch (error) {
    logger.error({ message: 'SNS Publish Failed', error: error.message });
  }
};

module.exports = { publishUploadEvent };