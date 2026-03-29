const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Field Tambahan Baru
    age: { type: Number },
    profileImage: { type: String, default: "https://cdn-icons-png.flaticon.com/512/149/149071.png" },
    education: { type: String }, // Contoh: S1 Teknik Informatika - Univ Mercu Buana
    createdAt: { type: Date, default: Date.now },
    // Tambahkan ini di dalam UserSchema
    bio: { type: String, default: "" },
    targetJob: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
});

module.exports = mongoose.model('User', UserSchema);