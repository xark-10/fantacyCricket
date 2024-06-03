const express = require('express');
const { addTeam, processResult, viewTeamResults } = require('../controllers/teamControllers');

const router = express.Router();

router.post('/add-team', addTeam);
router.post('/process-result', processResult);
router.get('/team-result', viewTeamResults);

module.exports = router;
