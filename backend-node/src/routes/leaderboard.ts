import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /leaderboard?limit=20&offset=0
router.get('/', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const users = db.prepare(`
    SELECT 
      u.id,
      u.username,
      COALESCE(SUM(b.payout), 0) as total_winnings
    FROM users u
    LEFT JOIN bets b ON u.id = b.user_id AND b.resolved = TRUE AND b.payout > 0
    GROUP BY u.id
    ORDER BY total_winnings DESC
    LIMIT ? OFFSET ?
  `).all(Number(limit), Number(offset));

  const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;

  res.json({
    data: users,
    total,
    limit: Number(limit),
    offset: Number(offset),
  });
});

export default router;