import { z } from 'zod';
import { EmploymentLevel, PreferencesCompany, CONFIDENCE_LEVELS } from '../model/InterviewSession.js';

// Schema bersama untuk field "mission" yang dipakai di 2 endpoint
const missionSchema = {
  positionApplied: z
    .string({ message: 'Position applied wajib diisi' })
    .trim()
    .min(1,   'Position applied tidak boleh kosong')
    .max(200, 'Position applied maksimal 200 karakter'),

  employmentLevel: z.enum(EmploymentLevel, {
    message: `Employment level harus salah satu dari: ${EmploymentLevel.join(', ')}`,
  }),

  companyType: z.enum(PreferencesCompany, {
    message: `Company type harus salah satu dari: ${PreferencesCompany.join(', ')}`,
  }),

  simulationLevel: z.enum(CONFIDENCE_LEVELS, {
    message: `Simulation level harus salah satu dari: ${CONFIDENCE_LEVELS.join(', ')}`,
  }),

  durationMinutes: z.coerce
    .number({ message: 'Durasi harus berupa angka' })
    .int('Durasi harus bilangan bulat')
    .min(1,   'Durasi minimal 1 menit')
    .max(120, 'Durasi maksimal 120 menit'),
};

// Dipakai di POST /sessions — wajib semua field
export const startSessionSchema = z.object(missionSchema);

// Dipakai di POST /validate-launch — sama persis, alias agar nama jelas
export const validateLaunchSchema = z.object(missionSchema);
