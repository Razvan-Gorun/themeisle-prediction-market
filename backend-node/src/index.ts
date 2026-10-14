import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import marketRoutes from './routes/markets.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import leaderboardRoutes from './routes/leaderboard.js';
import chatRoutes from './routes/chat.js'; // ← adăugat

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/markets', marketRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/chat', chatRoutes); // ← adăugat

app.get('/', (_req, res) => {
  res.send('Backend is running');
});

app.listen(port, () => {
  console.log(`🚀 Backend running at http://localhost:${port}`);
});