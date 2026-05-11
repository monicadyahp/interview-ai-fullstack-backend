const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    if (!email) return null;
    return User.findOne({ email: email.toLowerCase() });
  }

  async existsByEmail(email) {
    if (!email) return false;
    const found = await User.exists({ email: email.toLowerCase() });
    return Boolean(found);
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async updateById(id, data) {
    return User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async deleteById(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserRepository();
