const mongoose = require('mongoose');
const Player = require('../models/Player');
const playersData = require('../data/players.json');
const connectDB = require('../config/db');

const seedPlayers = async () => {
    await connectDB();

    try {
        await Player.deleteMany({});
        await Player.insertMany(playersData.map(player => ({
            name: player.Player,
            team: player.Team,
            role: player.Role,
        })));
        console.log('Players seeded');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedPlayers();
