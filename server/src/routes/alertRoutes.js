const express = require('express');
const { getAlertHistory } = require('../controllers/alertController');

const router = express.Router();

router.get('/', getAlertHistory);

module.exports = router;
