const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/search.controller');
const { authRequired } = require('../middleware/auth');

router.get('/', authRequired, ctrl.search);

module.exports = router;
