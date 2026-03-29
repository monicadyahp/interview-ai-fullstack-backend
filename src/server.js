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

// Gunakan Routes
app.use('/api', apiRoutes);

// --- PERBAIKAN UNTUK VERCEL ---
// Kita hanya jalankan app.listen kalau di laptop (local), 
// kalau di Vercel, kita biarkan Vercel yang menghandle.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

// WAJIB: Ekspor app untuk Vercel
module.exports = app;