import { Router } from 'express';
import * as interviewController from '../controller/InterviewController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import upload from '../../../middlewares/upload.js';
import validate from '../../../middlewares/validate.js';
import { startSessionSchema, validateLaunchSchema } from '../validator/interviewValidator.js';

const router = Router();
router.use(authMiddleware);

// ─── Pre-launch ───────────────────────────────────────────────────────────────
router.get('/pre-launch',                                    interviewController.getPreLaunchInfo);
router.post('/validate-launch', validate(validateLaunchSchema), interviewController.validateLaunch);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard',       interviewController.getDashboard);
router.get('/dashboard/trend', interviewController.getPerformanceTrend);

// ─── Sessions ─────────────────────────────────────────────────────────────────
router.post('/sessions', validate(startSessionSchema), interviewController.startSession);
router.get('/sessions',                                interviewController.getSessions);
router.get('/sessions/:id',                            interviewController.getSessionById);
router.post('/sessions/:id/predict', upload.single('file'), interviewController.predict);
router.patch('/sessions/:id/complete',                 interviewController.completeSession);
router.patch('/sessions/:id/abandon',                  interviewController.abandonSession);
router.get('/sessions/:id/summary',                    interviewController.getSessionSummary);
router.get('/sessions/:id/export',                     interviewController.exportSession);

export default router;
