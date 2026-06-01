import { z } from 'zod';
import { EmploymentLevel, PreferencesCompany } from '../model/User.js';

export const createUserSchema = z.object({
  firstName:   z.string({ message: 'First name wajib diisi' }).min(3, 'First name minimal 3 karakter'),
  lastName:    z.string().min(1, 'Last name minimal 1 karakter').optional(),
  email:       z.string({ message: 'Email wajib diisi' }).email('Format email tidak valid'),
  password:    z.string({ message: 'Password wajib diisi' }).min(8, 'Password minimal 8 karakter'),
  bio:         z.string().max(500, 'Bio maksimal 500 karakter').optional(),
  education:   z.string().max(200, 'Education maksimal 200 karakter').optional(),
  position:    z.string().max(100, 'Position maksimal 100 karakter').optional(),
  industry:    z.string().max(100, 'Industry maksimal 100 karakter').optional(),
  country:     z.string().max(100, 'Country maksimal 100 karakter').optional(),
  employment:  z.enum(EmploymentLevel).nullable().optional(),
  preferences: z.enum(PreferencesCompany).nullable().optional(),
});

export const updateUserSchema = z.object({
  firstName:   z.string().min(3, 'First name minimal 3 karakter').optional(),
  lastName:    z.string().optional(),
  bio:         z.string().max(500, 'Bio maksimal 500 karakter').optional(),
  education:   z.string().max(200, 'Education maksimal 200 karakter').optional(),
  position:    z.string().max(100, 'Position maksimal 100 karakter').optional(),
  industry:    z.string().max(100, 'Industry maksimal 100 karakter').optional(),
  country:     z.string().max(100, 'Country maksimal 100 karakter').optional(),
  employment:  z.enum(EmploymentLevel).nullable().optional(),
  preferences: z.enum(PreferencesCompany).nullable().optional(),
  // email & password tidak bisa diubah melalui endpoint ini
});
