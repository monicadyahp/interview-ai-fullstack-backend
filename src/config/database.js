import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log('[db] connected:', env.MONGO_URI);

  mongoose.connection.on('close', () => console.log('[db] disconnected'));
  mongoose.connection.on('error', (err) => {
    console.error('[db] error:', err);
    process.exit(1);
  });
};
