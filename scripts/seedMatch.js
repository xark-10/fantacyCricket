const mongoose = require('mongoose');
const Match = require('../models/Match');
const matchData = require('../data/match.json');
const connectDB = require('../config/db');

const seedMatches = async () => {
    await connectDB();

    try {
        await Match.deleteMany({});
        await Match.insertMany(matchData);
        console.log('Matches seeded');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedMatches();
