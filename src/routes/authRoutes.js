const router = require('express').Router();
const authController = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require('../validators/authValidator');

// Public
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Protected
router.get('/me', authMiddleware, authController.me);
router.put(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema),
  authController.updateProfile,
);

module.exports = router;
