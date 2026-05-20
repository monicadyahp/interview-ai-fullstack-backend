import { Router } from 'express';
import authRoutes      from '../services/authentications/routes/authRoutes.js';
import userRoutes      from '../services/users/routes/userRoutes.js';
import predictRoutes   from '../services/interviews/routes/predictRoutes.js';
import interviewRoutes from '../services/interviews/routes/interviewRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    name: 'Intersight API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register:      'POST /api/auth/register',
        login:         'POST /api/auth/login',
        loginGoogle:   'POST /api/auth/google    { token: <Google idToken> }',
        loginFacebook: 'POST /api/auth/facebook  { token: <FB accessToken> }',
        loginApple:    'POST /api/auth/apple     { token: <Apple identityToken> }',
        me:            'GET  /api/auth/me (Bearer)',
        updateProfile: 'PUT  /api/auth/profile (Bearer)',
        logout:        'POST /api/auth/logout (Bearer)',
      },
      users: {
        getAll:    'GET    /api/users (Bearer)',
        getById:   'GET    /api/users/:id (Bearer)',
        getByEmail:'GET    /api/users/email/:email (Bearer)',
        create:    'POST   /api/users (Bearer, multipart "avatar")',
        update:    'PUT    /api/users/:id (Bearer, multipart "avatar")',
        delete:    'DELETE /api/users/:id (Bearer)',
      },
      interviews: {
        dashboard:    'GET   /api/interviews/dashboard (Bearer)',
        trend:        'GET   /api/interviews/dashboard/trend?period=6m|1y (Bearer)',
        startSession: 'POST  /api/interviews/sessions (Bearer)',
        predict:      'POST  /api/interviews/sessions/:id/predict (Bearer, multipart "file")',
        complete:     'PATCH /api/interviews/sessions/:id/complete (Bearer)',
        abandon:      'PATCH /api/interviews/sessions/:id/abandon (Bearer)',
        listSessions: 'GET   /api/interviews/sessions (Bearer)',
        getSession:   'GET   /api/interviews/sessions/:id (Bearer)',
      },
      predict: {
        emotion: 'POST /api/predict (Bearer, multipart "file")',
        health:  'GET  /api/predict/health (Bearer)',
      },
    },
  });
});

router.use('/auth',       authRoutes);
router.use('/users',      userRoutes);
router.use('/interviews', interviewRoutes);
router.use('/predict',    predictRoutes);

export default router;
