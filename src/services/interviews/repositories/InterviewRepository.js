import { Types } from 'mongoose';
import InterviewSession from '../model/InterviewSession.js';

class InterviewRepository {
  create(userId) {
    return InterviewSession.create({ userId, startedAt: new Date() });
  }

  findById(id) {
    return InterviewSession.findById(id);
  }

  findByUserId(userId, filter = {}) {
    return InterviewSession.find({ userId, ...filter }).sort({ startedAt: -1 });
  }

  pushPrediction(sessionId, prediction) {
    return InterviewSession.findByIdAndUpdate(
      sessionId,
      { $push: { predictions: prediction } },
      { new: true },
    );
  }

  update(sessionId, data) {
    return InterviewSession.findByIdAndUpdate(sessionId, data, { new: true, runValidators: true });
  }

  // ─── Aggregations ─────────────────────────────────────────────────────────

  async getSimulationScoreStats(userId) {
    const uid = new Types.ObjectId(userId);
    const now = new Date();
    const sevenDaysAgo    = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

    const base  = { userId: uid, status: 'completed', score: { $ne: null } };
    const [overall, thisWeek, lastWeek] = await Promise.all([
      InterviewSession.aggregate([
        { $match: base },
        { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
      InterviewSession.aggregate([
        { $match: { ...base, completedAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
      InterviewSession.aggregate([
        { $match: { ...base, completedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
        { $group: { _id: null, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      avgScore:       overall[0]?.avgScore  ?? 0,
      totalCount:     overall[0]?.count     ?? 0,
      thisWeekAvg:    thisWeek[0]?.avgScore  ?? null,
      lastWeekAvg:    lastWeek[0]?.avgScore  ?? null,
      thisWeekCount:  thisWeek[0]?.count     ?? 0,
      lastWeekCount:  lastWeek[0]?.count     ?? 0,
    };
  }

  async getDominantConfidenceLevel(userId) {
    const uid = new Types.ObjectId(userId);
    const result = await InterviewSession.aggregate([
      { $match: { userId: uid, status: 'completed' } },
      { $unwind: '$predictions' },
      { $group: { _id: '$predictions.confidenceLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    return result[0]?._id ?? null;
  }

  async getPracticeStreakDates(userId) {
    const uid = new Types.ObjectId(userId);
    const result = await InterviewSession.aggregate([
      { $match: { userId: uid, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: 'UTC' } },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    return result.map((r) => r._id).filter(Boolean);
  }

  async getMonthlyTrend(userId, months) {
    const uid = new Types.ObjectId(userId);
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1));

    return InterviewSession.aggregate([
      {
        $match: {
          userId: uid,
          status: 'completed',
          completedAt: { $gte: startDate },
          score: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$completedAt' },
            month: { $month: '$completedAt' },
          },
          avgScore: { $avg: '$score' },
          count:    { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  async getEmotionsSummary(userId) {
    const uid = new Types.ObjectId(userId);
    const result = await InterviewSession.aggregate([
      { $match: { userId: uid, status: 'completed' } },
      { $unwind: '$predictions' },
      {
        $group: {
          _id: null,
          total:         { $sum: 1 },
          happy:         { $sum: { $cond: [{ $eq: ['$predictions.emotion', 'happy']   }, 1, 0] } },
          sad:           { $sum: { $cond: [{ $eq: ['$predictions.emotion', 'sad']     }, 1, 0] } },
          normal:        { $sum: { $cond: [{ $eq: ['$predictions.emotion', 'normal']  }, 1, 0] } },
          fear:          { $sum: { $cond: [{ $eq: ['$predictions.emotion', 'fear']    }, 1, 0] } },
          angry:         { $sum: { $cond: [{ $eq: ['$predictions.emotion', 'angry']   }, 1, 0] } },
          disgust:       { $sum: { $cond: [{ $eq: ['$predictions.emotion', 'disgust'] }, 1, 0] } },
          avgConfidence: { $avg: '$predictions.confidencePercent' },
        },
      },
    ]);
    return result[0] ?? null;
  }
}

export default new InterviewRepository();
