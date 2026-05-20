import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { allowedFileTypesPhoto } from './merge.js';

export const dynamicStorage = () =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath;

      if (file.fieldname === 'avatar') {
        uploadPath = path.join('public', 'images', 'avatars');
      } else {
        return cb(new Error('Invalid fieldname, must be avatar'), '');
      }

      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const date = new Date();
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const unique = `${formatted}-${Math.round(Math.random() * 1e9)}`;
      const ext = file.mimetype.split('/')[1];
      cb(null, `${file.fieldname}-${unique}.${ext}`);
    },
  });

export const fileFilter = (req, file, cb) => {
  const ext = file.mimetype.split('/')[1];
  if (file.fieldname === 'avatar' && !allowedFileTypesPhoto.includes(ext)) {
    return cb(new Error('Invalid avatar file type, allowed: png, jpg, jpeg'), false);
  }
  cb(null, true);
};

export const uploadDynamic = multer({ storage: dynamicStorage(), fileFilter });
