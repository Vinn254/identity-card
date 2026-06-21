const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lost.controller');
const { authRequired, requireRole } = require('../middleware/auth');

router.post('/',             authRequired, ctrl.create);
router.get('/mine',          authRequired, ctrl.myLost);
router.get('/stats/me',      authRequired, ctrl.stats);
router.get('/',              authRequired, requireRole('admin', 'security', 'staff'), ctrl.listAll);
router.get('/:id',           authRequired, ctrl.getOne);
router.patch('/:id/status',  authRequired, ctrl.updateStatus);

module.exports = router;
