const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const upload = require('../middleware/upload');
const authenticateToken = require('../middleware/auth');
const Document = require('../models/Document');
const { uploadToS3, generatePresignedUrl, deleteFromS3 } = require('../services/s3.service');
const { publishUploadEvent } = require('../services/sns.service');
const logger = require('../config/logger');

// 1. Upload Document
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  let s3Key = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileId = uuidv4();
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    s3Key = `documents/${req.user.id}/${fileId}-${sanitizedFileName}`;

    // S3 me upload
    await uploadToS3(s3Key, req.file.buffer, req.file.mimetype);

    // MongoDB me metadata save
    const docRecord = new Document({
      id: fileId,
      userId: req.user.id,
      fileName: sanitizedFileName,
      s3Key: s3Key,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
    await docRecord.save();

    // SNS Event Publish (Fire and forget)
    publishUploadEvent({
      eventId: uuidv4(),
      userId: req.user.id,
      objectKey: s3Key,
      fileName: sanitizedFileName
    });

    logger.info({ route: '/api/documents/upload', statusCode: 201, userId: req.user.id, docId: fileId });
    return res.status(201).json({ message: 'Upload successful', document: docRecord });
  } catch (error) {
    // Failure handling: Agar DB fail hua par S3 upload ho gaya to S3 se rollback (delete) karo
    if (s3Key) {
      await deleteFromS3(s3Key).catch(err => logger.error({ message: 'Rollback failed', err: err.message }));
    }
    logger.error({ route: '/api/documents/upload', statusCode: 500, error: error.message });
    return res.status(500).json({ error: 'File upload failed' });
  }
});

// 2. List Current User's Documents (With Pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userDocs = await Document.find({ userId: req.user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Document.countDocuments({ userId: req.user.id });

    res.json({ page, totalPages: Math.ceil(total / limit), totalDocs: total, documents: userDocs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// 3. Pre-signed Download URL
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findOne({ id: req.params.id });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to document' });
    }

    // fileName aur mimeType bhejo taaki instant download ho
    const downloadUrl = await generatePresignedUrl(doc.s3Key, doc.fileName, doc.mimeType);
    res.json({ downloadUrl });
  } catch (error) {
    logger.error({ route: '/api/documents/:id/download', error: error.message });
    res.status(500).json({ error: 'Download URL generation failed' });
  }
});

// 4. Delete Document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findOne({ id: req.params.id });

    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await deleteFromS3(doc.s3Key);
    await Document.deleteOne({ id: req.params.id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;