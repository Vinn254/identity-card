const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { authRequired, requireRole } = require('../middleware/auth');

router.get('/overview',           authRequired, requireRole('admin'), ctrl.overview);
router.get('/users',              authRequired, requireRole('admin'), ctrl.listUsers);
router.patch('/users/:id/active', authRequired, requireRole('admin'), ctrl.setActive);
router.get('/reports',            authRequired, requireRole('admin', 'security', 'staff'), ctrl.allReports);
router.get('/matches',            authRequired, requireRole('admin', 'security', 'staff'), ctrl.matches);
router.get('/activity',           authRequired, requireRole('admin'), ctrl.activity);
router.get('/all-notifications',  authRequired, requireRole('admin'), ctrl.allNotifications);

module.exports = router;
