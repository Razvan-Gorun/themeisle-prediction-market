import { Router } from 'express';
import db from '../db/database.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Toate rutele de profil necesită autentificare
router.use(requireAuth);

// GET /profile/active?limit=20&offset=0
router.get('/active', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { limit = 20, offset = 0 } = req.query;

  const bets = db.prepare(`
    SELECT 
      b.*,
      m.title as market_title,
      o.name as outcome_name,
      (SELECT SUM(total_bet) FROM outcomes WHERE market_id = m.id) as total_pool,
      (SELECT total_bet FROM outcomes WHERE id = b.outcome_id) as outcome_total
    FROM bets b
    JOIN markets m ON b.market_id = m.id
    JOIN outcomes o ON b.outcome_id = o.id
    WHERE b.user_id = ? AND b.resolved = FALSE
    ORDER BY b.placed_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, Number(limit), Number(offset));

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM bets WHERE user_id = ? AND resolved = FALSE
  `).get(userId) as { count: number }).count;

  const betsWithOdds = bets.map((bet: any) => {
    const odds = bet.total_pool > 0 ? (bet.total_pool / bet.outcome_total).toFixed(2) : 1;
    return { ...bet, current_odds: odds };
  });

  res.json({ data: betsWithOdds, total, limit: Number(limit), offset: Number(offset) });
});

// GET /profile/resolved?limit=20&offset=0
router.get('/resolved', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { limit = 20, offset = 0 } = req.query;

  const bets = db.prepare(`
    SELECT 
      b.*,
      m.title as market_title,
      o.name as outcome_name,
      m.resolution_outcome as winning_outcome,
      CASE 
        WHEN o.name = m.resolution_outcome THEN 'won'
        ELSE 'lost'
      END as result
    FROM bets b
    JOIN markets m ON b.market_id = m.id
    JOIN outcomes o ON b.outcome_id = o.id
    WHERE b.user_id = ? AND b.resolved = TRUE
    ORDER BY b.placed_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, Number(limit), Number(offset));

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM bets WHERE user_id = ? AND resolved = TRUE
  `).get(userId) as { count: number }).count;

  res.json({ data: bets, total, limit: Number(limit), offset: Number(offset) });
});

export default router;