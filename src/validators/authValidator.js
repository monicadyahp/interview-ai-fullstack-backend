const { z } = require('zod');

const registerSchema = z.object({
  username: z
    .string({ message: 'Username wajib diisi' })
    .trim()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter'),
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid'),
  password: z
    .string({ message: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
});

const loginSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid'),
  password: z.string({ message: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});

const updateProfileSchema = z
  .object({
    username: z.string().trim().min(3).max(50).optional(),
    age: z.coerce.number().int().min(0).max(150).optional(),
    profileImage: z.string().max(2048).optional(),
    education: z.string().max(200).optional(),
    bio: z.string().max(500).optional(),
    targetJob: z.string().max(100).optional(),
    linkedinUrl: z.union([z.string().url(), z.literal('')]).optional(),
  })
  .strict();

module.exports = { registerSchema, loginSchema, updateProfileSchema };
