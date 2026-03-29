const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Cek email sudah ada atau belum
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'Email sudah terdaftar' });

        user = new User({ username, email, password });
        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        await user.save();
        res.json({ msg: 'Registrasi berhasil, silakan login' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error: Gagal menyimpan ke database' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Email tidak ditemukan' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Password salah' });

        // Buat Token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1d' });
        // Ganti res.json di dalam exports.login dengan ini:
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email,
                // TAMBAHKAN SEMUA FIELD BERIKUT AGAR TIDAK HILANG SAAT LOGIN ULANG:
                age: user.age,
                profileImage: user.profileImage,
                education: user.education,
                bio: user.bio,
                targetJob: user.targetJob,
                linkedinUrl: user.linkedinUrl
            } 
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// ... import lama
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Update data profile
// Tambahkan fungsi ini di authController.js
// Update data profile di authController.js
// Update data profile di authController.js
exports.updateProfile = async (req, res) => {
    try {
        // 1. Tangkap linkedinUrl dari req.body
        const { username, age, education, profileImage, bio, targetJob, email, linkedinUrl } = req.body; // TAMBAHKAN linkedinUrl DI SINI

        if (!email) {
            return res.status(400).json({ msg: 'Email wajib ada untuk sinkronisasi profil' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { email: email.toLowerCase() }, 
            { 
                $set: { 
                    username, 
                    age, 
                    education, 
                    profileImage, 
                    bio, 
                    targetJob,
                    linkedinUrl // 2. SIMPAN KE DATABASE (TAMBAHKAN INI)
                },
                $setOnInsert: { password: 'google-login-user-' + Math.random() } 
            },
            { returnDocument: 'after', upsert: true, runValidators: false }
        );

        console.log("User tersinkronisasi:", updatedUser.email);

        // Tambahkan isGoogle: true di dalam res.json fungsi updateProfile
        res.json({
            id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            age: updatedUser.age,
            education: updatedUser.education,
            profileImage: updatedUser.profileImage,
            bio: updatedUser.bio,
            targetJob: updatedUser.targetJob,
            linkedinUrl: updatedUser.linkedinUrl,
            isGoogle: true // <--- TAMBAHKAN INI
        });
    } catch (err) {
        console.error("Error Upsert Profile:", err.message);
        res.status(500).json({ msg: 'Gagal sinkronisasi data profil.' });
    }
};