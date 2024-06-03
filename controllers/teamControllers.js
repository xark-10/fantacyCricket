const Team = require('../models/Team');
const Player = require('../models/Player');
const Match = require('../models/Match');

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
        console.log("Teams saved")
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const processResult = async (req, res) => {
    try {
        const teams = await Team.find().populate('players').populate('captain').populate('viceCaptain');

        const matches = await Match.find();

        const calculateBattingPoints = (runs, boundaries, sixes, isDuck, totalRuns) => {
            let points = 0;
            points += runs || 0;
            points += boundaries || 0;
            points += (sixes || 0) * 2;
            if (totalRuns >= 30 && totalRuns < 50) points += 4;
            if (totalRuns >= 50 && totalRuns < 100) points += 8;
            if (totalRuns >= 100) points += 16;
            if (isDuck) points -= 2;
            return points;
        };

        const calculateBowlingPoints = (wickets, lbwOrBowled, maidens, totalWickets) => {
            let points = 0;
            points += (wickets || 0) * 25;
            points += (lbwOrBowled || 0) * 8;
            if (totalWickets >= 3 && totalWickets < 4) points += 4;
            if (totalWickets >= 4 && totalWickets < 5) points += 8;
            if (totalWickets >= 5) points += 16;
            points += (maidens || 0) * 12;
            return points;
        };

        const calculateFieldingPoints = (fieldingStats) => {
            let points = 0;
            points += (fieldingStats.catches || 0) * 8;
            if ((fieldingStats.catches || 0) >= 3) points += 4;
            points += (fieldingStats.stumpings || 0) * 12;
            points += (fieldingStats.runOuts || 0) * 6;
            return points;
        };

        const playerPointsMap = {};

        matches.forEach(ball => {
            const batter = ball.batter;
            const bowler = ball.bowler;
            const fielders = ball.fielders_involved ? ball.fielders_involved.split(', ') : [];

            if (!playerPointsMap[batter]) playerPointsMap[batter] = { batting: 0, bowling: 0, fielding: 0, totalRuns: 0, totalWickets: 0, boundaries: 0, sixes: 0, isDuck: false };
            if (!playerPointsMap[bowler]) playerPointsMap[bowler] = { batting: 0, bowling: 0, fielding: 0, totalRuns: 0, totalWickets: 0, boundaries: 0, sixes: 0, isDuck: false };
            fielders.forEach(fielder => {
                if (!playerPointsMap[fielder]) playerPointsMap[fielder] = { batting: 0, bowling: 0, fielding: 0, totalRuns: 0, totalWickets: 0, boundaries: 0, sixes: 0, isDuck: false };
            });

            playerPointsMap[batter].totalRuns += ball.batsman_run;
            if (ball.batsman_run >= 4) playerPointsMap[batter].boundaries++;
            if (ball.batsman_run >= 6) playerPointsMap[batter].sixes++;

            if (ball.isWicketDelivery && ball.kind !== 'run out') {
                playerPointsMap[bowler].totalWickets++;
                if (ball.kind === 'bowled' || ball.kind === 'lbw') playerPointsMap[bowler].lbwOrBowled = (playerPointsMap[bowler].lbwOrBowled || 0) + 1;
            }
            if (ball.extra_type === 'NA' && ball.batsman_run === 0 && ball.total_run === 0) {
                playerPointsMap[bowler].maidens = (playerPointsMap[bowler].maidens || 0) + 1;
            }

            fielders.forEach(fielder => {
                if (!playerPointsMap[fielder].fieldingStats) {
                    playerPointsMap[fielder].fieldingStats = { catches: 0, stumpings: 0, runOuts: 0 };
                }
                if (ball.kind === 'catch') playerPointsMap[fielder].fieldingStats.catches++;
                if (ball.kind === 'stumped') playerPointsMap[fielder].fieldingStats.stumpings++;
                if (ball.kind === 'run out') playerPointsMap[fielder].fieldingStats.runOuts++;
            });
        });

        for (let team of teams) {
            let totalPoints = 0;

            for (let player of team.players) {
                const playerStats = playerPointsMap[player.name] || {};
                console.log(`Calculating points for player: ${player.name}`);

                const battingPoints = calculateBattingPoints(
                    playerStats.totalRuns,
                    playerStats.boundaries,
                    playerStats.sixes,
                    playerStats.isDuck,
                    playerStats.totalRuns
                );
                const bowlingPoints = calculateBowlingPoints(
                    playerStats.totalWickets,
                    playerStats.lbwOrBowled,
                    playerStats.maidens,
                    playerStats.totalWickets
                );
                const fieldingPoints = calculateFieldingPoints(
                    playerStats.fieldingStats || {}
                );

                let playerPoints = battingPoints + bowlingPoints + fieldingPoints;

                console.log(`Player: ${player.name}, Batting Points: ${battingPoints}, Bowling Points: ${bowlingPoints}, Fielding Points: ${fieldingPoints}, Total Points Before Multiplier: ${playerPoints}`);

                if (player._id && team.captain && team.captain._id && team.viceCaptain && team.viceCaptain._id) {
                    if (player._id.equals(team.captain._id)) {
                        playerPoints *= 2;
                    } else if (player._id.equals(team.viceCaptain._id)) {
                        playerPoints *= 1.5;
                    }
                } else {
                    console.log("Player, Captain, or Vice-Captain ID is missing or not an ObjectId.");
                    console.log("Player ID:", player._id);
                    console.log("Captain ID:", team.captain ? team.captain._id : null);
                    console.log("Vice-Captain ID:", team.viceCaptain ? team.viceCaptain._id : null);
                }

                console.log(`Player: ${player.name}, Total Points After Multiplier: ${playerPoints}`);

                if (!isNaN(playerPoints)) {
                    totalPoints += playerPoints;
                } else {
                    console.error(`NaN detected for player: ${player.name}, skipping this player's points.`);
                }
            }

            console.log(`Total Points for Team: ${team.name}: ${totalPoints}`);

            team.points = totalPoints;
            await team.save(); 
            
        }

        res.status(200).json({ message: 'Results processed' });
    } catch (err) {
        console.log("Error: " + err.message);
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
