const Team = require('../models/Team');
const Player = require('../models/Player');
const matchData = require('../data/match.json');

const addTeam = async (req, res) => {
    try {
        const { name, players, captain, viceCaptain } = req.body;

        if (players.length !== 11) {
            return res.status(400).json({ message: 'A team must have 11 players' });
        }

        if (!players.includes(captain) || !players.includes(viceCaptain)) {
            return res.status(400).json({ message: 'Captain and Vice-Captain must be in the team' });
        }

        const playerIds = await Player.find({ name: { $in: players } }).select('_id');
        const captainId = await Player.findOne({ name: captain }).select('_id');
        const viceCaptainId = await Player.findOne({ name: viceCaptain }).select('_id');

        const newTeam = new Team({
            name,
            players: playerIds,
            captain: captainId,
            viceCaptain: viceCaptainId,
        });

        await newTeam.save();
        res.status(201).json(newTeam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const processResult = async (req, res) => {
    try {
        const teams = await Team.find().populate('players').populate('captain').populate('viceCaptain');

        teams.forEach(team => {
            let totalPoints = 0;

            team.players.forEach(player => {
                let playerPoints = 0;


                if (player._id.equals(team.captain._id)) {
                    playerPoints *= 2;
                } else if (player._id.equals(team.viceCaptain._id)) {
                    playerPoints *= 1.5;
                }

                totalPoints += playerPoints;
            });

            team.points = totalPoints;
            team.save();
        });

        res.status(200).json({ message: 'Results processed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const viewTeamResults = async (req, res) => {
    try {
        const teams = await Team.find().sort({ points: -1 }).populate('players');

        const topTeams = teams.filter(team => team.points === teams[0].points);

        res.status(200).json(topTeams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { addTeam, processResult, viewTeamResults };
