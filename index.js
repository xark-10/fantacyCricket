const express = require('express');
const app = express();
const PORT = 3000;

const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const teamRoutes = require('./routes/teamRoutes');



connectDB();

app.use(bodyParser.json());

app.use('/api', teamRoutes);


app.listen(PORT, () => console.log(`Server started on port ${PORT}`));


