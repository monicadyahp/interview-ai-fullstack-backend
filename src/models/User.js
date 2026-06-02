const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Password tidak wajib untuk user yang login via Google
    password: { type: String, required: function () { return this.authProvider !== 'google'; } },
    // Identitas penyedia autentikasi
    authProvider: { type: String, default: 'local' }, // 'local' | 'google'
    googleId: { type: String },
    // Field Tambahan Baru
    age: { type: Number },
    profileImage: { type: String, default: "https://cdn-icons-png.flaticon.com/512/149/149071.png" },
    education: { type: String }, // Contoh: S1 Teknik Informatika - Univ Mercu Buana
    createdAt: { type: Date, default: Date.now },
    // Tambahkan ini di dalam UserSchema
    bio: { type: String, default: "" },
    targetJob: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    // Field profil untuk personalisasi prompt interview
    industry: { type: String, default: "" },
    country: { type: String, default: "" },
    employmentLevel: { type: String, default: "" },
    preferenceCompany: { type: String, default: "" },
});

module.exports = mongoose.model('User', UserSchema);
