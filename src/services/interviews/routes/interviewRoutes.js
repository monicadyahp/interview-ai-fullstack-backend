import { Router } from 'express';
import * as interviewController from '../controller/InterviewController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import upload from '../../../middlewares/upload.js';

const router = Router();
router.use(authMiddleware);

// Dashboard
router.get('/dashboard',       interviewController.getDashboard);
router.get('/dashboard/trend', interviewController.getPerformanceTrend);

// Sessions
router.post('/sessions',                      interviewController.startSession);
router.get('/sessions',                       interviewController.getSessions);
router.get('/sessions/:id',                   interviewController.getSessionById);
router.post('/sessions/:id/predict', upload.single('file'), interviewController.predict);
router.patch('/sessions/:id/complete',        interviewController.completeSession);
router.patch('/sessions/:id/abandon',         interviewController.abandonSession);

export default router;
