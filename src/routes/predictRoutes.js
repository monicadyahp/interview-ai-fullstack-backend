const router = require('express').Router();
const predictController = require('../controllers/PredictController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.use(authMiddleware);

router.get('/health', predictController.health);
router.post('/', upload.single('file'), predictController.predict);

module.exports = router;
