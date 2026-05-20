import PDFDocument from 'pdfkit';
import interviewRepository from '../repositories/InterviewRepository.js';
import predictService from './PredictService.js';
import { EMOTIONS, CONFIDENCE_LEVELS, EmploymentLevel, PreferencesCompany, toConfidenceLevel } from '../model/InterviewSession.js';
import userRepository from '../../users/repository/UserRepository.js';
import NotFoundError from '../../../exceptions/not-found-error.js';
import AuthorizationError from '../../../exceptions/authorization-error.js';
import InvariantError from '../../../exceptions/invariant-error.js';

const CONFIDENCE_LABELS = {
  low:            'Low Confidence',
  medium:         'Medium',
  confident:      'Confident',
  very_confident: 'Very Confident',
};

const CONFIDENCE_RANKS = {
  low:            'Keep Practicing',
  medium:         'Above Average',
  confident:      'Top 15% of users',
  very_confident: 'Top 10% of users',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

class InterviewService {

  // ─── Pre-launch ────────────────────────────────────────────────────────────

  /**
   * Dipanggil saat halaman interview dibuka.
   * Kembalikan data profil user (untuk auto-fill) + status emotion API.
   */
  async getPreLaunchInfo(userId) {
    const [user, emotionApiStatus] = await Promise.all([
      userRepository.findById(userId),
      this._checkEmotionApi(),
    ]);

    return {
      emotionApi:  emotionApiStatus,
      userProfile: user ? {
        employment:  user.employment  || null,
        preferences: user.preferences || null,
        position:    user.position    || null,
      } : null,
      options: {
        employmentLevels:  EmploymentLevel,
        companyTypes:      PreferencesCompany,
        simulationLevels:  CONFIDENCE_LEVELS.map((l) => ({
          value: l,
          label: CONFIDENCE_LABELS[l],
        })),
      },
    };
  }

  /**
   * Validasi semua persyaratan sebelum klik "Launch Simulation".
   * Kembalikan status tiap check sehingga frontend bisa tahu persis yang gagal.
   */
  async validateLaunch(payload) {
    const { positionApplied, employmentLevel, companyType, simulationLevel, durationMinutes } = payload;

    const emotionApiStatus = await this._checkEmotionApi();

    const checks = {
      positionApplied: {
        valid:   Boolean(positionApplied?.trim()),
        message: positionApplied?.trim() ? null : 'Position applied wajib diisi',
      },
      employmentLevel: {
        valid:   EmploymentLevel.includes(employmentLevel),
        message: EmploymentLevel.includes(employmentLevel) ? null : 'Employment level tidak valid',
      },
      companyType: {
        valid:   PreferencesCompany.includes(companyType),
        message: PreferencesCompany.includes(companyType) ? null : 'Company type tidak valid',
      },
      simulationLevel: {
        valid:   CONFIDENCE_LEVELS.includes(simulationLevel),
        message: CONFIDENCE_LEVELS.includes(simulationLevel) ? null : 'Simulation level tidak valid',
      },
      durationMinutes: {
        valid:   Number.isInteger(Number(durationMinutes)) && Number(durationMinutes) >= 1,
        message: Number(durationMinutes) >= 1 ? null : 'Durasi minimal 1 menit',
      },
      emotionApi: emotionApiStatus,
    };

    const allValid = Object.values(checks).every((c) => c.valid);

    return {
      valid:   allValid,
      checks,
      message: allValid
        ? 'Semua persyaratan terpenuhi, simulasi siap dimulai'
        : 'Beberapa persyaratan belum terpenuhi, simulasi tidak dapat dimulai',
    };
  }

  // ─── Session lifecycle ─────────────────────────────────────────────────────

  async startSession(userId, missionData = {}) {
    const { positionApplied, employmentLevel, companyType, simulationLevel, durationMinutes } = missionData;

    if (!positionApplied?.trim()) throw new InvariantError('Position applied wajib diisi');
    if (!EmploymentLevel.includes(employmentLevel))  throw new InvariantError('Employment level tidak valid');
    if (!PreferencesCompany.includes(companyType))   throw new InvariantError('Company type tidak valid');
    if (!CONFIDENCE_LEVELS.includes(simulationLevel)) throw new InvariantError('Simulation level tidak valid');
    if (!durationMinutes || Number(durationMinutes) < 1) throw new InvariantError('Durasi minimal 1 menit');

    return interviewRepository.create(userId, {
      positionApplied: positionApplied.trim(),
      employmentLevel,
      companyType,
      simulationLevel,
      durationMinutes: Number(durationMinutes),
    });
  }

  async predict(sessionId, userId, file) {
    const session = await interviewRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Sesi interview tidak ditemukan');
    if (session.userId.toString() !== userId) throw new AuthorizationError('Akses ditolak');
    if (session.status !== 'in_progress') throw new InvariantError('Sesi interview sudah selesai atau ditinggalkan');

    const result = await predictService.predictEmotion(file);

    const rawEmotion = result.predictedClass?.toLowerCase() ?? 'normal';
    const emotion = EMOTIONS.includes(rawEmotion) ? rawEmotion : 'normal';

    const prediction = {
      emotion,
      confidence:        result.confidence        ?? 0,
      confidencePercent: result.confidencePercent ?? 0,
      confidenceLevel:   toConfidenceLevel(result.confidence ?? 0),
      meetsThreshold:    result.meetsConfidenceThreshold ?? false,
      capturedAt:        new Date(),
    };

    await interviewRepository.pushPrediction(sessionId, prediction);
    return { prediction, emotionResult: result };
  }

  async completeSession(sessionId, userId) {
    const session = await interviewRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Sesi interview tidak ditemukan');
    if (session.userId.toString() !== userId) throw new AuthorizationError('Akses ditolak');
    if (session.status === 'completed')  throw new InvariantError('Sesi interview sudah selesai');
    if (session.status === 'abandoned')  throw new InvariantError('Sesi interview sudah ditinggalkan');

    if (session.predictions.length === 0) {
      return interviewRepository.update(sessionId, { status: 'abandoned', completedAt: new Date() });
    }

    const avgScore = session.predictions.reduce((s, p) => s + p.confidencePercent, 0)
      / session.predictions.length;

    const counts = {};
    for (const p of session.predictions) counts[p.emotion] = (counts[p.emotion] || 0) + 1;
    const dominantEmotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

    return interviewRepository.update(sessionId, {
      status: 'completed',
      score: Math.round(avgScore * 100) / 100,
      dominantEmotion,
      completedAt: new Date(),
    });
  }

  async abandonSession(sessionId, userId) {
    const session = await interviewRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Sesi interview tidak ditemukan');
    if (session.userId.toString() !== userId) throw new AuthorizationError('Akses ditolak');
    if (session.status !== 'in_progress') throw new InvariantError('Sesi tidak dalam status aktif');
    return interviewRepository.update(sessionId, { status: 'abandoned', completedAt: new Date() });
  }

  async getSessionById(sessionId, userId) {
    const session = await interviewRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Sesi interview tidak ditemukan');
    if (session.userId.toString() !== userId) throw new AuthorizationError('Akses ditolak');
    return session;
  }

  async getUserSessions(userId, { status } = {}) {
    const filter = status ? { status } : {};
    return interviewRepository.findByUserId(userId, filter);
  }

  // ─── Session summary & export ──────────────────────────────────────────────

  async getSessionSummary(sessionId, userId) {
    const session = await interviewRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Sesi interview tidak ditemukan');
    if (session.userId.toString() !== userId) throw new AuthorizationError('Akses ditolak');

    const emotionsData = await interviewRepository.getSessionEmotionSummary(sessionId);
    const emotionsSummary = this._buildEmotionsSummary(emotionsData);

    // Hitung distribusi confidence level
    const levelCounts = {};
    for (const p of session.predictions) {
      levelCounts[p.confidenceLevel] = (levelCounts[p.confidenceLevel] || 0) + 1;
    }

    return {
      sessionId:      session._id,
      positionApplied: session.positionApplied,
      employmentLevel: session.employmentLevel,
      companyType:     session.companyType,
      simulationLevel: session.simulationLevel,
      durationMinutes: session.durationMinutes,
      status:          session.status,
      score:           session.score,
      dominantEmotion: session.dominantEmotion,
      totalPredictions: session.predictions.length,
      startedAt:       session.startedAt,
      completedAt:     session.completedAt,
      emotionsSummary,
      confidenceLevelDistribution: levelCounts,
    };
  }

  /**
   * Generate PDF laporan hasil sesi.
   * Kembalikan Buffer yang siap dikirim sebagai response binary.
   */
  async exportSessionPDF(sessionId, userId) {
    const summary = await this.getSessionSummary(sessionId, userId);
    const session = await interviewRepository.findById(sessionId);

    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end',  () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - 100; // usable width

      // ── Header ────────────────────────────────────────────────
      doc.fontSize(20).fillColor('#5B21B6').text('Intersight', 50, 50);
      doc.fontSize(11).fillColor('#555').text('Interview Emotion Analysis Report', 50, 76);
      doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#E5E7EB').stroke();

      // ── Session info ──────────────────────────────────────────
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#111').text('Session Info', { underline: false });
      doc.moveDown(0.3);
      const info = [
        ['Date',             this._formatDate(session.completedAt || session.startedAt)],
        ['Position Applied', summary.positionApplied || '-'],
        ['Employment Level', summary.employmentLevel || '-'],
        ['Company Type',     summary.companyType     || '-'],
        ['Simulation Level', CONFIDENCE_LABELS[summary.simulationLevel] || summary.simulationLevel || '-'],
        ['Duration',         `${summary.durationMinutes} minutes`],
        ['Status',           summary.status],
        ['Overall Score',    summary.score != null ? `${summary.score} / 100` : '-'],
        ['Dominant Emotion', summary.dominantEmotion || '-'],
        ['Total Snapshots',  String(summary.totalPredictions)],
      ];
      doc.fontSize(10).fillColor('#374151');
      for (const [label, value] of info) {
        doc.text(`${label}: `, { continued: true }).fillColor('#111').text(value).fillColor('#374151');
      }

      // ── Emotion Summary ───────────────────────────────────────
      doc.moveDown(1);
      doc.fontSize(14).fillColor('#111').text('Emotion Summary');
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#374151')
        .text(`Overall Confidence: ${summary.emotionsSummary.overall}%`);
      doc.moveDown(0.3);

      const emotions = summary.emotionsSummary.emotions;
      const rows = Object.entries(emotions);
      const colW = W / 2;

      // Draw table header
      const tableTop = doc.y;
      doc.rect(50, tableTop, W, 20).fillColor('#5B21B6').fill();
      doc.fillColor('#FFF').fontSize(10)
        .text('Emotion', 55, tableTop + 5, { width: colW - 5 })
        .text('Percentage', 50 + colW, tableTop + 5, { width: colW - 5 });

      let rowY = tableTop + 20;
      rows.forEach(([emotion, pct], i) => {
        const bg = i % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.rect(50, rowY, W, 18).fillColor(bg).fill();
        doc.fillColor('#111').fontSize(10)
          .text(emotion.charAt(0).toUpperCase() + emotion.slice(1), 55, rowY + 4, { width: colW - 5 })
          .text(`${pct}%`, 50 + colW, rowY + 4, { width: colW - 5 });
        rowY += 18;
      });
      doc.rect(50, tableTop, W, rowY - tableTop).strokeColor('#E5E7EB').stroke();

      // ── Confidence Level Distribution ─────────────────────────
      doc.moveDown(1.5);
      doc.fontSize(14).fillColor('#111').text('Confidence Level Distribution');
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#374151');
      for (const [level, count] of Object.entries(summary.confidenceLevelDistribution)) {
        doc.text(`${CONFIDENCE_LABELS[level] || level}: ${count} snapshots`);
      }

      // ── Footer ────────────────────────────────────────────────
      doc.fontSize(8).fillColor('#9CA3AF')
        .text(`Generated by Intersight · ${this._formatDate(new Date())}`, 50, 780, {
          align: 'center', width: W,
        });

      doc.end();
    });
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboard(userId) {
    const [stats, dominantLevel, streakDates, emotionsData] = await Promise.all([
      interviewRepository.getSimulationScoreStats(userId),
      interviewRepository.getDominantConfidenceLevel(userId),
      interviewRepository.getPracticeStreakDates(userId),
      interviewRepository.getEmotionsSummary(userId),
    ]);

    return {
      simulationScore:  this._buildSimulationScore(stats),
      totalSimulations: this._buildTotalSimulations(stats),
      aiConfidenceLevel: dominantLevel
        ? { level: dominantLevel, label: CONFIDENCE_LABELS[dominantLevel], rank: CONFIDENCE_RANKS[dominantLevel] }
        : null,
      practiceStreak:  { days: this._calculateStreak(streakDates) },
      emotionsSummary: this._buildEmotionsSummary(emotionsData),
    };
  }

  async getPerformanceTrend(userId, period = '6m') {
    const months = period === '1y' ? 12 : 6;
    const rawTrend = await interviewRepository.getMonthlyTrend(userId, months);

    const now = new Date();
    const curYear  = now.getUTCFullYear();
    const curMonth = now.getUTCMonth();

    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d     = new Date(Date.UTC(curYear, curMonth - i, 1));
      const year  = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1;
      const found = rawTrend.find((r) => r._id.year === year && r._id.month === month);
      result.push({
        month:    MONTH_NAMES[d.getUTCMonth()],
        year,
        avgScore: found ? Math.round(found.avgScore * 100) / 100 : 0,
        count:    found?.count ?? 0,
      });
    }
    return result;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  async _checkEmotionApi() {
    try {
      await predictService.healthCheck();
      return { valid: true, status: 'ready', message: null };
    } catch {
      return { valid: false, status: 'failed', message: 'Layanan emotion detection tidak dapat dijangkau' };
    }
  }

  _buildSimulationScore({ avgScore, thisWeekAvg, lastWeekAvg }) {
    return {
      value:  Math.round(avgScore * 100) / 100,
      change: this._percentChange(lastWeekAvg, thisWeekAvg),
    };
  }

  _buildTotalSimulations({ totalCount, thisWeekCount, lastWeekCount }) {
    return {
      value:          totalCount,
      changeThisWeek: thisWeekCount - lastWeekCount,
    };
  }

  _percentChange(prev, curr) {
    if (prev == null || curr == null) return null;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  _calculateStreak(dates) {
    if (!dates.length) return 0;

    const now = new Date();
    const todayStr     = now.toISOString().slice(0, 10);
    const yesterday    = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const mostRecent = dates[0];
    if (mostRecent !== todayStr && mostRecent !== yesterdayStr) return 0;

    let streak = 0;
    const cursor = new Date(mostRecent + 'T00:00:00Z');

    for (const dateStr of dates) {
      if (dateStr === cursor.toISOString().slice(0, 10)) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  _buildEmotionsSummary(data) {
    if (!data || data.total === 0) {
      return { overall: 0, emotions: { happy: 0, sad: 0, normal: 0, fear: 0, angry: 0, disgust: 0 } };
    }

    const { total, happy, sad, normal, fear, angry, disgust, avgConfidence } = data;
    const pct = (n) => Math.round((n / total) * 1000) / 10;

    return {
      overall: Math.round((avgConfidence ?? 0) * 10) / 10,
      emotions: { happy: pct(happy), sad: pct(sad), normal: pct(normal), fear: pct(fear), angry: pct(angry), disgust: pct(disgust) },
    };
  }

  _formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}

export default new InterviewService();
