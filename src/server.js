const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const apiRoutes = require('./routes/api');

dotenv.config();
const app = express();

// Hubungkan ke MongoDB
connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Gunakan Routes (Kriteria: RESTful API konvensi standar)
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fullstack Server started on port ${PORT}`));