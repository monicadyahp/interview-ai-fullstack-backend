const router = require('express').Router();
const authRoutes = require('./authRoutes');
const predictRoutes = require('./predictRoutes');

router.get('/', (req, res) => {
  res.json({
    name: 'Intersight API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Bearer)',
        updateProfile: 'PUT /api/auth/profile (Bearer)',
      },
      predict: {
        emotion: 'POST /api/predict (Bearer, multipart field "file")',
        health: 'GET /api/predict/health (Bearer)',
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/predict', predictRoutes);

module.exports = router;
