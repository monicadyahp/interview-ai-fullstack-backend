import { Router } from 'express';
import * as userController from '../controller/userController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import validate from '../../../middlewares/validate.js';
import { uploadDynamic } from '../../../utils/multer.js';
import { createUserSchema, updateUserSchema } from '../validator/userSchema.js';

const router = Router();

router.use(authMiddleware);

// GET /api/users
router.get('/', userController.getAllUsers);

// GET /api/users/email/:email  — harus sebelum /:id agar tidak tertimpa
router.get('/email/:email', userController.getUserByEmail);

// GET /api/users/:id
router.get('/:id', userController.getUserById);

// POST /api/users
router.post(
  '/',
  uploadDynamic.single('avatar'),
  validate(createUserSchema),
  userController.createUser,
);

// PUT /api/users/:id
router.put(
  '/:id',
  uploadDynamic.single('avatar'),
  validate(updateUserSchema),
  userController.updateUser,
);

// DELETE /api/users/:id
router.delete('/:id', userController.deleteUser);

export default router;
