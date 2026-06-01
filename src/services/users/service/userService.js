import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcrypt';
import NotFoundError from '../../../exceptions/not-found-error.js';
import InvariantError from '../../../exceptions/invariant-error.js';
import userRepository from '../repository/UserRepository.js';

export class UserService {
  constructor(repo) {
    this.repo = repo || userRepository;
  }

  async getAllUsers() {
    return await this.repo.getAll();
  }

  async getUserById(id) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User tidak ditemukan');
    return user;
  }

  async getUserByEmail(email) {
    const user = await this.repo.findByEmail(email);
    if (!user) throw new NotFoundError('User tidak ditemukan');
    return user;
  }

  async createUser(data, avatarFilename = null) {
    const exists = await this.repo.existsByEmail(data.email);
    if (exists) throw new InvariantError('Email sudah terdaftar');

    const passwordHash = await bcrypt.hash(data.password, 10);
    return await this.repo.create({
      ...data,
      password: passwordHash,
      ...(avatarFilename ? { avatar: avatarFilename } : {}),
    });
  }

  async updateUserById(id, data, newAvatarFilename = null) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User tidak ditemukan');

    const updateData = { ...data };

    if (newAvatarFilename) {
      // Hapus file avatar lama jika tersimpan lokal (bukan URL eksternal)
      if (user.avatar && !user.avatar.startsWith('http')) {
        const oldPath = path.join(path.resolve(), 'public', 'images', 'avatars', user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.avatar = newAvatarFilename;
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return await this.repo.updateById(id, updateData);
  }

  async deleteUserById(id) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User tidak ditemukan');

    // Hapus file avatar lokal jika ada
    if (user.avatar && !user.avatar.startsWith('http')) {
      const filePath = path.join(path.resolve(), 'public', 'images', 'avatars', user.avatar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await this.repo.deleteById(id);
  }
}

export default new UserService();
