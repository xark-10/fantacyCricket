const express = require('express');
const app = express();
const PORT = 3000;

const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const teamRoutes = require('./routes/teamRoutes');

// Endpoints

// app.get('/', async (req, res) => {
//   res.send('Hello World!');
// });

// app.get('/demo', async (req, res) => {
//   await sampleCreate();
//   res.send({status: 1, message: "demo"});
// });

// //

// Connect Database
connectDB();

app.use(bodyParser.json());

// Define Routes
app.use('/api', teamRoutes);


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


