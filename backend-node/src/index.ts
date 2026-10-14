import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import marketRoutes from './routes/markets.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import leaderboardRoutes from './routes/leaderboard.js';
import chatRoutes from './routes/chat.js';
import { runSeed } from './db/seed.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

// Trust proxy pentru cookie-uri secure în spatele Render
app.set('trust proxy', 1);

// Listă de origin-uri permise (dev + producție)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/markets', marketRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/chat', chatRoutes);

app.get('/', (_req, res) => {
  res.send('Backend is running');
});

// Pornire: întâi seed (dacă e nevoie), apoi listen
(async () => {
  try {
    await runSeed();
  } catch (err) {
    console.error('⚠️ Eroare la seed (continuăm oricum):', err);
  }

  app.listen(port, () => {
    console.log(`🚀 Backend running at http://localhost:${port}`);
  });
})();
