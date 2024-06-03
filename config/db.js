const mongoose = require('mongoose');
const uri = "mongodb+srv://mariyano:mariyano@task-mariyano.gvvx318.mongodb.net/?retryWrites=true&w=majority&appName=task-mariyano";

const connectDB = async () => {
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;