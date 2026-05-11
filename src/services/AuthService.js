const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const jwtUtil = require('../utils/jwt');
const userRepository = require('../repositories/UserRepository');

const SALT_ROUNDS = 10;

class AuthService {
  constructor(repo = userRepository) {
    this.userRepository = repo;
  }

  async register({ username, email, password }) {
    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw ApiError.conflict('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.userRepository.create({
      username,
      email,
      password: passwordHash,
    });

    return user.toSafeJSON();
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Email atau password salah');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw ApiError.unauthorized('Email atau password salah');
    }

    const token = jwtUtil.sign({
      id: user._id.toString(),
      email: user.email,
    });

    return {
      token,
      user: user.toSafeJSON(),
    };
  }

  async updateProfile(userId, payload) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User tidak ditemukan');
    }

    const { password, email, _id, id, ...allowed } = payload;
    const updated = await this.userRepository.updateById(userId, allowed);

    return updated.toSafeJSON();
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User tidak ditemukan');
    }
    return user.toSafeJSON();
  }
}

module.exports = new AuthService();
