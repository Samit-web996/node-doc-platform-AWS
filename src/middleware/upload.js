const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|jpg|jpeg|png/i;
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/pjpeg',
    'application/octet-stream'
  ];

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeMatch = allowedMimeTypes.includes(file.mimetype.toLowerCase());

  if (extName && mimeMatch) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

module.exports = upload;