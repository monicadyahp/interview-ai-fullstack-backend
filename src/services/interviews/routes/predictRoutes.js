import { Router } from 'express';
import * as predictController from '../controller/PredictController.js';
import authMiddleware from '../../../middlewares/authMiddleware.js';
import upload from '../../../middlewares/upload.js';

const router = Router();

router.use(authMiddleware);
router.get('/health', predictController.health);
router.post('/', upload.single('file'), predictController.predict);

export default router;
