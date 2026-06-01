import multer from 'multer';
import ApiError from '../utils/ApiError.js';

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

export default upload;
