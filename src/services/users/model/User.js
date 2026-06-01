import mongoose from 'mongoose';
import { getPublicPhotoUrl } from '../../../utils/helper.js';

export const EmploymentLevel    = ['Internship', 'Full-Time', 'Part-Time', 'Freelance'];
export const PreferencesCompany = ['Startup', 'Agency', 'Corporate', 'Tech-Company'];
export const AuthProvider       = ['local', 'google', 'facebook', 'apple'];

const UserSchema = new mongoose.Schema(
  {
    avatar: { type: String, default: null },

    firstName: { type: String, required: true },
    lastName:  { type: String, default: '' },
    email:     { type: String, required: true, unique: true },

    // null untuk user yang daftar via social auth (tidak punya password)
    password: { type: String, default: null },

    provider:   { type: String, enum: AuthProvider, default: 'local' },
    googleId:   { type: String, default: null },
    facebookId: { type: String, default: null },
    appleId:    { type: String, default: null },

    bio:       { type: String, default: '' },
    education: { type: String, default: '' },
    position:  { type: String, default: '' },
    industry:  { type: String, default: '' },
    country:   { type: String, default: '' },

    employment:  { type: String, enum: [...EmploymentLevel, null], default: null },
    preferences: { type: String, enum: [...PreferencesCompany, null], default: null },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.virtual('avatarUrl').get(function () {
  if (!this.avatar) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  if (
    this.avatar.startsWith('http://') ||
    this.avatar.startsWith('https://') ||
    this.avatar.startsWith('data:')
  )
    return this.avatar;
  return `${getPublicPhotoUrl('users')}${this.avatar}`;
});

UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.googleId;
  delete obj.facebookId;
  delete obj.appleId;
  return obj;
};

export default mongoose.model('User', UserSchema);
