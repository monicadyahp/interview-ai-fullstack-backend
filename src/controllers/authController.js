const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: rahasia & masa berlaku JWT diambil dari .env (SECRET_KEY)
const JWT_SECRET = process.env.SECRET_KEY || 'secretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper: bentuk objek user yang dikirim ke frontend (selalu konsisten)
const buildUserPayload = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    age: user.age,
    profileImage: user.profileImage,
    education: user.education,
    bio: user.bio,
    targetJob: user.targetJob,
    linkedinUrl: user.linkedinUrl,
    industry: user.industry,
    country: user.country,
    employmentLevel: user.employmentLevel,
    preferenceCompany: user.preferenceCompany,
    authProvider: user.authProvider,
});

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

        // User Google tidak punya password lokal
        if (!user.password) {
            return res.status(400).json({ msg: 'Akun ini terdaftar via Google. Silakan login dengan Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Password salah' });

        // Buat Token JWT
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ token, user: buildUserPayload(user) });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Login / Register via Google (access token flow)
exports.googleLogin = async (req, res) => {
    try {
        const { credential, accessToken } = req.body;
        let googleId, email, name, picture;

        if (credential) {
            // Legacy ID token flow (kept for backwards compatibility)
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            ({ sub: googleId, email, name, picture } = payload);
        } else if (req.body.googleUser) {
            // User info fetched on the frontend (browser), passed directly
            const { googleId: gId, email: gEmail, name: gName, picture: gPicture } = req.body.googleUser;
            if (!gEmail) {
                return res.status(400).json({ msg: 'Data akun Google tidak lengkap.' });
            }
            googleId = gId;
            email = gEmail;
            name = gName;
            picture = gPicture;
        } else {
            return res.status(400).json({ msg: 'Credential Google tidak ditemukan' });
        }

        if (!email) {
            return res.status(400).json({ msg: 'Email Google tidak tersedia' });
        }

        // Cari user berdasarkan email, kalau belum ada buat baru
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            user = new User({
                username: name || email.split('@')[0],
                email: email.toLowerCase(),
                authProvider: 'google',
                googleId,
                profileImage: picture || undefined,
            });
            await user.save();
        } else if (!user.googleId) {
            // Tautkan akun lokal yang sudah ada dengan identitas Google-nya
            user.googleId = googleId;
            if (!user.profileImage && picture) user.profileImage = picture;
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ token, user: buildUserPayload(user) });
    } catch (err) {
        console.error('Google Login Error:', err.message);
        res.status(401).json({ msg: 'Verifikasi Google gagal. Silakan coba lagi.' });
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
exports.updateProfile = async (req, res) => {
    try {
        const {
            username, age, education, profileImage, bio, targetJob, email, linkedinUrl,
            industry, country, employmentLevel, preferenceCompany,
        } = req.body;

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
                    linkedinUrl,
                    industry,
                    country,
                    employmentLevel,
                    preferenceCompany,
                },
                // Saat profil disinkronkan dari sesi Google sebelum user terbuat,
                // tandai sebagai akun google (password tidak wajib lagi di schema).
                $setOnInsert: { authProvider: 'google' },
            },
            { returnDocument: 'after', upsert: true, runValidators: false }
        );

        console.log('User tersinkronisasi:', updatedUser.email);

        res.json(buildUserPayload(updatedUser));
    } catch (err) {
        console.error('Error Upsert Profile:', err.message);
        res.status(500).json({ msg: 'Gagal sinkronisasi data profil.' });
    }
};
