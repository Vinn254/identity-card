const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        authRequired, ctrl.me);

module.exports = router;
