const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    age: { type: Number, min: 0, max: 150 },
    profileImage: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    },
    education: { type: String, default: '' },
    bio: { type: String, default: '' },
    targetJob: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ versionKey: false });
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
