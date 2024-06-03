// models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    viceCaptain: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    points: { type: Number, default: 0 },
});

module.exports = mongoose.model('Team', teamSchema);
