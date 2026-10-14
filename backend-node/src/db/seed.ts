import db from './database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    console.log('📦 Baza de date are deja date. Se renunță la seed.');
    return;
  }

  const saltRounds = 10;

  // Admin
  const adminPass = await bcrypt.hash('admin', saltRounds);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', adminPass, 'admin');

  // User normal
  const userPass = await bcrypt.hash('user', saltRounds);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('user', userPass, 'user');

  // Alice
  const alicePass = await bcrypt.hash('alice', saltRounds);
  const aliceResult = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('alice', alicePass);
  const aliceId = aliceResult.lastInsertRowid;

  // Piețe
  const market1 = db.prepare('INSERT INTO markets (title, description, creator_id) VALUES (?, ?, ?)').run(
    'Will Bitcoin reach $100k by end of 2024?', 'Predict the price of Bitcoin', aliceId
  );
  const market1Id = market1.lastInsertRowid;
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market1Id, 'Yes', 200);
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market1Id, 'No', 75);

  const market2 = db.prepare('INSERT INTO markets (title, description, creator_id) VALUES (?, ?, ?)').run(
    'Will it rain tomorrow in NYC?', 'Weather prediction', aliceId
  );
  const market2Id = market2.lastInsertRowid;
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market2Id, 'Yes', 50);
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market2Id, 'No', 75);
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market2Id, 'Maybe', 100);

  const market3 = db.prepare('INSERT INTO markets (title, description, creator_id) VALUES (?, ?, ?)').run(
    'Who will win the 2024 US Presidential Election?', 'Election prediction', aliceId
  );
  const market3Id = market3.lastInsertRowid;
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market3Id, 'Candidate A', 50);
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market3Id, 'Candidate B', 75);
  db.prepare('INSERT INTO outcomes (market_id, name, total_bet) VALUES (?, ?, ?)').run(market3Id, 'Other', 100);

  console.log('🌱 Seed complet!');
}

seed().catch(console.error);
