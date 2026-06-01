import { Router } from 'express';
import * as authController from '../controller/AuthController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import validate from '../../../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  socialAuthSchema,
} from '../validator/authValidator.js';

const router = Router();

// ─── Local Auth ───────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);

// ─── Social Auth (frontend kirim token dari provider) ─────────────────────────
router.post('/google',   validate(socialAuthSchema), authController.loginWithGoogle);
router.post('/facebook', validate(socialAuthSchema), authController.loginWithFacebook);
router.post('/apple',    validate(socialAuthSchema), authController.loginWithApple);

// ─── Protected ────────────────────────────────────────────────────────────────
router.get('/me',      authMiddleware, authController.me);
router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);
router.post('/logout', authMiddleware, authController.logout);

export default router;
