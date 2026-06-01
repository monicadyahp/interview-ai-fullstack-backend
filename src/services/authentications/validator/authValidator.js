import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string({ message: 'Nama lengkap wajib diisi' })
    .trim()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid'),
  password: z
    .string({ message: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  confirmPassword: z
    .string({ message: 'Konfirmasi password wajib diisi' })
    .min(6, 'Konfirmasi password minimal 6 karakter'),
});

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email wajib diisi' })
    .trim()
    .toLowerCase()
    .email('Format email tidak valid'),
  password: z
    .string({ message: 'Password wajib diisi' })
    .min(1, 'Password wajib diisi'),
});

export const updateProfileSchema = z.object({
  avatar:      z.string().optional(),
  firstName:   z.string().trim().min(3, 'Nama depan minimal 3 karakter').max(50).optional(),
  lastName:    z.string().trim().max(50).optional(),
  bio:         z.string().max(500, 'Bio maksimal 500 karakter').optional(),
  education:   z.string().max(200).optional(),
  position:    z.string().max(100).optional(),
  industry:    z.string().max(200).optional(),
  country:     z.string().max(100).optional(),
  employment:  z.string().optional(),
  preferences: z.string().optional(),
});

// Validator untuk social auth — frontend kirim token dari provider
export const socialAuthSchema = z.object({
  token: z.string({ message: 'Token dari provider wajib diisi' }).min(1, 'Token tidak boleh kosong'),
});
