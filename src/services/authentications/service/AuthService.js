import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import jwtUtil from '../../../utils/jwt.js';
import env from '../../../config/env.js';
import userRepository from '../../users/repository/UserRepository.js';
import AuthenticationError from '../../../exceptions/authentication-error.js';
import InvariantError from '../../../exceptions/invariant-error.js';
import NotFoundError from '../../../exceptions/not-found-error.js';

const SALT_ROUNDS = 10;

class AuthService {
  constructor(repo = userRepository) {
    this.userRepository = repo;
    this._googleClient = null;
  }

  _getGoogleClient() {
    if (!this._googleClient) {
      this._googleClient = new OAuth2Client(env.OAUTH.googleClientId);
    }
    return this._googleClient;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  _splitFullName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0],
      lastName:  parts.slice(1).join(' ') || '',
    };
  }

  _signToken(user) {
    return jwtUtil.sign({ id: user._id.toString(), email: user.email });
  }

  // ─── Local Auth ───────────────────────────────────────────────────────────

  async register({ fullName, email, password, confirmPassword }) {
    if (password !== confirmPassword) {
      throw new InvariantError('Password dan konfirmasi password tidak cocok');
    }

    const exists = await this.userRepository.existsByEmail(email);
    if (exists) throw new InvariantError('Email sudah terdaftar, silakan login');

    const { firstName, lastName } = this._splitFullName(fullName);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.userRepository.create({
      firstName,
      lastName,
      email,
      password: passwordHash,
      provider: 'local',
    });

    const token = this._signToken(user);
    return { token, user: user.toSafeJSON() };
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new AuthenticationError('Email atau password salah');

    // Social auth user mencoba login dengan password
    if (!user.password) {
      throw new AuthenticationError(`Akun ini terdaftar via ${user.provider}. Gunakan tombol login ${user.provider}`);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AuthenticationError('Email atau password salah');

    const token = this._signToken(user);
    return { token, user: user.toSafeJSON() };
  }

  // ─── Social Auth ──────────────────────────────────────────────────────────

  async loginWithGoogle(idToken) {
    if (!env.OAUTH.googleClientId) {
      throw new InvariantError('Google OAuth belum dikonfigurasi di server');
    }

    let payload;
    try {
      const ticket = await this._getGoogleClient().verifyIdToken({
        idToken,
        audience: env.OAUTH.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AuthenticationError('Token Google tidak valid atau sudah kedaluwarsa');
    }

    const { sub: googleId, email, name, picture } = payload;
    return this._findOrCreateSocialUser({
      socialField: 'googleId',
      socialId: googleId,
      email,
      name,
      avatar: picture || null,
      provider: 'google',
    });
  }

  async loginWithFacebook(accessToken) {
    if (!env.OAUTH.facebookAppId) {
      throw new InvariantError('Facebook OAuth belum dikonfigurasi di server');
    }

    let fbData;
    try {
      const res = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`,
      );
      if (!res.ok) throw new Error('Facebook Graph API error');
      fbData = await res.json();
      if (fbData.error) throw new Error(fbData.error.message);
    } catch {
      throw new AuthenticationError('Token Facebook tidak valid atau sudah kedaluwarsa');
    }

    return this._findOrCreateSocialUser({
      socialField: 'facebookId',
      socialId: fbData.id,
      email: fbData.email,
      name: fbData.name,
      avatar: fbData.picture?.data?.url || null,
      provider: 'facebook',
    });
  }

  async loginWithApple(identityToken) {
    if (!env.OAUTH.appleClientId) {
      throw new InvariantError('Apple OAuth belum dikonfigurasi di server');
    }

    let appleData;
    try {
      appleData = await appleSignin.verifyIdToken(identityToken, {
        audience: env.OAUTH.appleClientId,
        ignoreExpiration: false,
      });
    } catch {
      throw new AuthenticationError('Token Apple tidak valid atau sudah kedaluwarsa');
    }

    return this._findOrCreateSocialUser({
      socialField: 'appleId',
      socialId: appleData.sub,
      email: appleData.email,
      name: appleData.email?.split('@')[0] || 'Apple User',
      avatar: null,
      provider: 'apple',
    });
  }

  // Cari user berdasarkan social ID → jika belum ada, cek email → jika belum ada, buat baru
  async _findOrCreateSocialUser({ socialField, socialId, email, name, avatar, provider }) {
    let user = await this.userRepository.findBySocialId(socialField, socialId);

    if (!user && email) {
      user = await this.userRepository.findByEmail(email);
      if (user) {
        // Tautkan akun social ke akun yang sudah ada
        user = await this.userRepository.updateById(user._id, {
          [socialField]: socialId,
          provider,
          ...(avatar && !user.avatar ? { avatar } : {}),
        });
      }
    }

    if (!user) {
      const { firstName, lastName } = this._splitFullName(name || email?.split('@')[0] || 'User');
      user = await this.userRepository.create({
        firstName,
        lastName,
        email,
        [socialField]: socialId,
        avatar: avatar || null,
        provider,
      });
    }

    const token = this._signToken(user);
    return { token, user: user.toSafeJSON() };
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User tidak ditemukan');
    return user.toSafeJSON();
  }

  async updateProfile(userId, payload) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User tidak ditemukan');

    const { password, email, _id, id, googleId, facebookId, appleId, provider, ...allowed } = payload;
    const updated = await this.userRepository.updateById(userId, allowed);

    return updated.toSafeJSON();
  }
}

export default new AuthService();
