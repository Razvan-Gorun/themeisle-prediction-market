import { Router, Request, Response } from 'express';
import db from '../db/database.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

type MarketRow = {
  id: number;
  title: string;
  description: string | null;
  creator_id: number;
  status: string;
  resolution_outcome: string | null;
  created_at: string;
  creator_name: string;
  total_value: number;
  participants: number;
};

type OutcomeRow = {
  id: number;
  market_id: number;
  name: string;
  total_bet: number;
};

// GET /markets – listare cu filtre și paginare
router.get('/', (req: Request, res: Response) => {
  let { status = 'active', sort = 'createdAt', order = 'desc', limit = 20, offset = 0 } = req.query;

  const sortMapping: Record<string, string> = {
    createdAt: 'created_at',
    total_value: 'total_value',
    participants: 'participants'
  };
  const sortColumn = sortMapping[sort as string] || 'created_at';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  let sql = `
    SELECT 
      m.*,
      u.username as creator_name,
      (SELECT SUM(total_bet) FROM outcomes WHERE market_id = m.id) as total_value,
      (SELECT COUNT(DISTINCT user_id) FROM bets WHERE market_id = m.id) as participants
    FROM markets m
    JOIN users u ON m.creator_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }

  sql += ` ORDER BY ${sortColumn} ${sortOrder}`;
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const markets = db.prepare(sql).all(...params) as MarketRow[];

  let countSql = 'SELECT COUNT(*) as total FROM markets WHERE 1=1';
  const countParams: any[] = [];
  if (status) {
    countSql += ' AND status = ?';
    countParams.push(status);
  }
  const total = (db.prepare(countSql).get(...countParams) as { total: number }).total;

  const marketIds = markets.map(m => m.id);
  let outcomes: OutcomeRow[] = [];
  if (marketIds.length > 0) {
    const placeholders = marketIds.map(() => '?').join(',');
    outcomes = db.prepare(`SELECT * FROM outcomes WHERE market_id IN (${placeholders})`).all(...marketIds) as OutcomeRow[];
  }

  const outcomesByMarket: Record<number, OutcomeRow[]> = {};
  outcomes.forEach(o => {
    if (!outcomesByMarket[o.market_id]) {
      outcomesByMarket[o.market_id] = [];
    }
    outcomesByMarket[o.market_id].push(o);
  });

  const marketsWithOutcomes = markets.map(m => {
    const marketOutcomes = outcomesByMarket[m.id] || [];
    const totalPool = marketOutcomes.reduce((sum, o) => sum + o.total_bet, 0);
    const outcomesWithOdds = marketOutcomes.map(o => ({
      ...o,
      odds: totalPool > 0 ? (totalPool / o.total_bet).toFixed(2) : 1,
    }));
    return {
      ...m,
      outcomes: outcomesWithOdds,
    };
  });

  res.json({
    data: marketsWithOutcomes,
    total,
    limit: Number(limit),
    offset: Number(offset),
  });
});

// GET /markets/:id – detalii piață
router.get('/:id', (req: Request, res: Response) => {
  const market = db.prepare(`
    SELECT m.*, u.username as creator_name
    FROM markets m
    JOIN users u ON m.creator_id = u.id
    WHERE m.id = ?
  `).get(req.params.id) as any;

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  const outcomes = db.prepare('SELECT * FROM outcomes WHERE market_id = ?').all(req.params.id) as OutcomeRow[];
  const totalPool = outcomes.reduce((sum, o) => sum + o.total_bet, 0);
  const outcomesWithOdds = outcomes.map(o => ({
    ...o,
    odds: totalPool > 0 ? (totalPool / o.total_bet).toFixed(2) : 1,
  }));

  res.json({ ...market, outcomes: outcomesWithOdds });
});

// POST /markets/:id/bets – plasare pariu (necesită autentificare)
router.post('/:id/bets', requireAuth, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { outcomeId, amount } = req.body;
    const userId = req.user!.id;

    if (!outcomeId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid outcomeId or amount' });
    }

    // Verifică dacă piața există și este activă
    const market = db.prepare(`SELECT * FROM markets WHERE id = ? AND status = 'active'`).get(id) as any;
    if (!market) {
      return res.status(404).json({ error: 'Market not found or not active' });
    }

    // Verifică dacă outcome-ul aparține pieței
    const outcome = db.prepare('SELECT * FROM outcomes WHERE id = ? AND market_id = ?').get(outcomeId, id) as any;
    if (!outcome) {
      return res.status(400).json({ error: 'Invalid outcome' });
    }

    // Verifică soldul utilizatorului
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as any;
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Tranzacție
    const transaction = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
      db.prepare('INSERT INTO bets (user_id, market_id, outcome_id, amount) VALUES (?, ?, ?, ?)')
        .run(userId, id, outcomeId, amount);
      db.prepare('UPDATE outcomes SET total_bet = total_bet + ? WHERE id = ?').run(amount, outcomeId);
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('Eroare la plasarea pariului:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// POST /markets/:id/resolve – rezolvare piață (doar admin)
router.post('/:id/resolve', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { winningOutcomeId } = req.body;

    if (!winningOutcomeId) {
      return res.status(400).json({ error: 'winningOutcomeId required' });
    }

    // Verifică dacă piața există și este activă
    const market = db.prepare(`SELECT * FROM markets WHERE id = ? AND status = 'active'`).get(id) as any;
    if (!market) {
      return res.status(404).json({ error: 'Market not found or already resolved' });
    }

    // Verifică dacă outcome-ul aparține pieței
    const outcome = db.prepare('SELECT * FROM outcomes WHERE id = ? AND market_id = ?').get(winningOutcomeId, id) as any;
    if (!outcome) {
      return res.status(400).json({ error: 'Invalid outcome' });
    }

    // Tranzacție pentru rezolvare
    const transaction = db.transaction(() => {
      // 1. Actualizează statusul pieței
      db.prepare('UPDATE markets SET status = "resolved", resolution_outcome = ? WHERE id = ?').run(outcome.name, id);

      // 2. Calculează total pool și total câștigător
      const outcomes = db.prepare('SELECT * FROM outcomes WHERE market_id = ?').all(id) as any[];
      const totalPool = outcomes.reduce((sum, o) => sum + o.total_bet, 0);
      const winningOutcomeTotal = outcome.total_bet;

      // 3. Obține toate pariurile pe outcome-ul câștigător
      const winningBets = db.prepare(`
        SELECT * FROM bets WHERE market_id = ? AND outcome_id = ? AND resolved = FALSE
      `).all(id, winningOutcomeId) as any[];

      // 4. Pentru fiecare pariu câștigător, calculează payout și actualizează soldul
      for (const bet of winningBets) {
        const payout = (bet.amount / winningOutcomeTotal) * totalPool;
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, bet.user_id);
        db.prepare('UPDATE bets SET resolved = TRUE, payout = ? WHERE id = ?').run(payout, bet.id);
      }

      // 5. Marchează pariurile pierzătoare ca rezolvate (payout = 0)
      db.prepare(`
        UPDATE bets SET resolved = TRUE, payout = 0 
        WHERE market_id = ? AND outcome_id != ? AND resolved = FALSE
      `).run(id, winningOutcomeId);
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error('Eroare la rezolvarea pieței:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default router;