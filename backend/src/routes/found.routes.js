const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ctrl = require('../controllers/found.controller');
const { authRequired, requireRole } = require('../middleware/auth');

const uploadDir = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:    (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.post('/',            authRequired, upload.single('image'), ctrl.create);
router.get('/mine',         authRequired, ctrl.myFound);
router.get('/',             authRequired, requireRole('admin', 'security', 'staff'), ctrl.listAll);
router.patch('/:id/status', authRequired, ctrl.updateStatus);

module.exports = router;
