const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({

  // Folder where files will be stored
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },

  // Rename uploaded file
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  }

});

// Allowed file types
const fileFilter = (req, file, cb) => {

  const allowedTypes = /jpg|jpeg|png|pdf|doc|docx/;

  const extension = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimeType = allowedTypes.test(file.mimetype);

  if (extension && mimeType) {
    return cb(null, true);
  }

  cb(new Error('Only Images, PDF and Word files are allowed'));
};

// Upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = upload;