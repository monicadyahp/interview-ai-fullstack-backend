import userService from '../service/userService.js';
import ClientError from '../../../exceptions/client-error.js';

const handleError = (res, error) => {
  if (error instanceof ClientError) {
    return res.status(error.statusCode).json({
      status: 'fail',
      message: error.message,
    });
  }

  console.error('[userController]', error);
  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
};

// GET /api/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({
      status: 'success',
      message: 'Data user berhasil ditemukan',
      data: users,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({
      status: 'success',
      message: 'Detail user berhasil ditemukan',
      data: user.toSafeJSON(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/users/email/:email
export const getUserByEmail = async (req, res) => {
  try {
    const user = await userService.getUserByEmail(req.params.email);
    return res.status(200).json({
      status: 'success',
      message: 'Detail user berhasil ditemukan',
      data: user.toSafeJSON(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const avatarFilename = req.file?.filename ?? null;
    const user = await userService.createUser(req.body, avatarFilename);
    return res.status(201).json({
      status: 'success',
      message: 'User berhasil dibuat',
      data: user.toSafeJSON(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const avatarFilename = req.file?.filename ?? null;
    const user = await userService.updateUserById(req.params.id, req.body, avatarFilename);
    return res.status(200).json({
      status: 'success',
      message: 'User berhasil diperbarui',
      data: user.toSafeJSON(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUserById(req.params.id);
    return res.status(200).json({
      status: 'success',
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    return handleError(res, error);
  }
};
