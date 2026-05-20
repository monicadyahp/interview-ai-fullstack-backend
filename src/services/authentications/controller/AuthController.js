import authService from '../service/AuthService.js';
import ClientError from '../../../exceptions/client-error.js';

const handleError = (res, error) => {
  if (error instanceof ClientError) {
    return res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
    });
  }

  console.error('[AuthController]', error);
  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { token, user } = await authService.register(req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      token,
      user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { token, user } = await authService.login(req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/auth/google
export const loginWithGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await authService.loginWithGoogle(token);
    return res.status(200).json({
      status: 'success',
      message: 'Login dengan Google berhasil',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/auth/facebook
export const loginWithFacebook = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await authService.loginWithFacebook(token);
    return res.status(200).json({
      status: 'success',
      message: 'Login dengan Facebook berhasil',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/auth/apple
export const loginWithApple = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await authService.loginWithApple(token);
    return res.status(200).json({
      status: 'success',
      message: 'Login dengan Apple berhasil',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/auth/me  (protected)
export const me = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({
      status: 'success',
      user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PUT /api/auth/profile  (protected)
export const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Profil berhasil diperbarui',
      user,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/auth/logout  (protected)
export const logout = async (req, res) => {
  try {
    // JWT bersifat stateless — token tidak bisa dihapus dari server.
    // Logout dilakukan dengan menghapus token di sisi client (localStorage / cookie).
    return res.status(200).json({
      status: 'success',
      message: 'Logout berhasil. Hapus token di sisi client.',
    });
  } catch (error) {
    return handleError(res, error);
  }
};
