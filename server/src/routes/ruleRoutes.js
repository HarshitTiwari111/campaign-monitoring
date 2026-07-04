const express = require('express');
const { getRules, createRule, updateRule, deleteRule } = require('../controllers/ruleController');

const router = express.Router();

router.get('/', getRules);
router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

module.exports = router;
