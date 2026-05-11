const multer = require('multer');
const ApiError = require('../utils/ApiError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(ApiError.badRequest('File harus berupa gambar (jpg/jpeg/png)'));
    }
    cb(null, true);
  },
});

module.exports = upload;
