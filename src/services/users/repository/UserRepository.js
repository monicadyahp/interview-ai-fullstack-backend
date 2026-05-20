import User from '../model/User.js';

class UserRepository {
  async getAll() {
    return await User.find().select('-password -googleId -facebookId -appleId');
  }

  async findById(id) {
    return await User.findById(id);
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  // Cari user berdasarkan social provider ID
  // field: 'googleId' | 'facebookId' | 'appleId'
  async findBySocialId(field, id) {
    return await User.findOne({ [field]: id });
  }

  async existsByEmail(email) {
    return !!(await User.exists({ email }));
  }

  async create(data) {
    return await User.create(data);
  }

  async updateById(id, data) {
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteById(id) {
    return !!(await User.findByIdAndDelete(id));
  }
}

export default new UserRepository();
