import { Request, Response, NextFunction } from 'express';
import db from '../db/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    balance: number;
    role: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = db.prepare('SELECT id, username, balance, role FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};