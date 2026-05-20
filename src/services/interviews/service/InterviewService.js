import interviewRepository from '../repositories/InterviewRepository.js';
import predictService from './PredictService.js';
import { EMOTIONS, toConfidenceLevel } from '../model/InterviewSession.js';
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

  // ─── Session lifecycle ─────────────────────────────────────────────────────

  async startSession(userId) {
    return interviewRepository.create(userId);
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

    // Hitung dominant emotion
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
    const curMonth = now.getUTCMonth(); // 0-indexed

    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d     = new Date(Date.UTC(curYear, curMonth - i, 1));
      const year  = d.getUTCFullYear();
      const month = d.getUTCMonth() + 1; // 1-indexed for aggregation match
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

  _buildSimulationScore({ avgScore, thisWeekAvg, lastWeekAvg }) {
    return {
      value:  Math.round(avgScore * 100) / 100,
      change: this._percentChange(lastWeekAvg, thisWeekAvg),
    };
  }

  _buildTotalSimulations({ totalCount, thisWeekCount, lastWeekCount }) {
    return {
      value:           totalCount,
      changeThisWeek:  thisWeekCount - lastWeekCount,
    };
  }

  _percentChange(prev, curr) {
    if (prev == null || curr == null) return null;
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10; // 1 decimal
  }

  _calculateStreak(dates) {
    // dates: ['YYYY-MM-DD', ...] sorted newest first (UTC)
    if (!dates.length) return 0;

    const now = new Date();
    const todayStr     = now.toISOString().slice(0, 10);
    const yesterday    = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const mostRecent = dates[0];
    // Streak sudah putus jika sesi terakhir lebih dari kemarin
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
      return {
        overall: 0,
        emotions: { happy: 0, sad: 0, normal: 0, fear: 0, angry: 0, disgust: 0 },
      };
    }

    const { total, happy, sad, normal, fear, angry, disgust, avgConfidence } = data;
    const pct = (n) => Math.round((n / total) * 1000) / 10; // 1 decimal

    return {
      overall: Math.round((avgConfidence ?? 0) * 10) / 10,
      emotions: {
        happy:   pct(happy),
        sad:     pct(sad),
        normal:  pct(normal),
        fear:    pct(fear),
        angry:   pct(angry),
        disgust: pct(disgust),
      },
    };
  }
}

export default new InterviewService();
