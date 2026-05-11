const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/AuthService');

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({
    message: 'Registrasi berhasil',
    user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.status(200).json({
    message: 'Login berhasil',
    token,
    user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.status(200).json({
    message: 'Profil berhasil diperbarui',
    user,
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ user });
});

module.exports = { register, login, updateProfile, me };
