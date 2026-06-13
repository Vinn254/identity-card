const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifications.controller');
const { authRequired } = require('../middleware/auth');

router.get('/',                    authRequired, ctrl.list);
router.get('/unread-count',        authRequired, ctrl.unreadCount);
router.patch('/:id/read',          authRequired, ctrl.markRead);
router.patch('/mark-all-read',     authRequired, ctrl.markAllRead);

module.exports = router;
