import connectDB from '../config/database.js';
import User from '../models/User.js';
import Planner from '../models/Planner.js';
import logger from '../utils/logger.js';

const run = async () => {
  try {
    await connectDB();

    const email = 'lucythiongo20@gmail.com';
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      logger.error(`User not found or inactive: ${email}`);
      process.exit(1);
    }

    // Week 16–20 Feb 2026 (Monday–Friday)
    const weekStart = new Date('2026-02-16T00:00:00.000Z');

    // Clean up any existing planner for this user + weekStart to avoid duplicates
    await Planner.deleteMany({ userId: user._id, weekCreatedAt: weekStart });

    const days = [
      {
        day: 'Monday',
        date: new Date('2026-02-16T00:00:00.000Z'),
        place: 'Babandogo / luckysummer',
        means: 'matatu',
        allowance: '500',
        prospects: 'revisits'
      },
      {
        day: 'Tuesday',
        date: new Date('2026-02-17T00:00:00.000Z'),
        place: 'Machakos',
        means: 'With Jeff',
        allowance: '',
        prospects: ''
      },
      {
        day: 'Wednesday',
        date: new Date('2026-02-18T00:00:00.000Z'),
        place: 'Kayole, nasra',
        means: 'matatu',
        allowance: '',
        prospects: 'Revisits, look for prospects'
      },
      {
        day: 'Thursday',
        date: new Date('2026-02-19T00:00:00.000Z'),
        place: 'Kagundo road',
        means: 'matatu',
        allowance: '650',
        prospects: 'visit st monica regarding our quotation'
      },
      {
        day: 'Friday',
        date: new Date('2026-02-20T00:00:00.000Z'),
        place: 'kahawa west, zimmerman',
        means: 'matatu',
        allowance: '550',
        prospects: 'revisits look for business'
      }
    ];

    const planner = await Planner.create({
      userId: user._id,
      weekCreatedAt: weekStart,
      days,
      notes: ''
    });

    logger.info(`Seeded planner for ${email} (id: ${planner._id}) for week starting 2026-02-16`);
    process.exit(0);
  } catch (err) {
    logger.error('Seed planner script error:', err);
    process.exit(1);
  }
};

run();

