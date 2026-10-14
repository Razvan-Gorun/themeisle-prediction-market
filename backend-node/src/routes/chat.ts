import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Toate rutele de chat necesită autentificare (opțional, poți permite și neautentificaților)
router.use(requireAuth);

// POST /chat – primește un mesaj și returnează un răspuns
router.post('/', (req: AuthRequest, res) => {
  const { message } = req.body;
  const userId = req.user!.id;
  const username = req.user!.username;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Răspunsuri simple bazate pe cuvinte cheie
  let reply = '';
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('bună') || lowerMsg.includes('salut')) {
    reply = `Salut, ${username}! Cu ce te pot ajuta?`;
  } else if (lowerMsg.includes('piață') || lowerMsg.includes('market')) {
    reply = 'Poți vedea toate piețele active pe pagina principală. Acolo poți plasa pariuri.';
  } else if (lowerMsg.includes('pariu') || lowerMsg.includes('bet')) {
    reply = 'Pentru a plasa un pariu, intră pe o piață, selectează o opțiune și introdu suma.';
  } else if (lowerMsg.includes('sold') || lowerMsg.includes('balanță')) {
    reply = `Soldul tău actual este $${req.user!.balance}.`;
  } else if (lowerMsg.includes('admin') || lowerMsg.includes('operator') || lowerMsg.includes('dispecer')) {
    reply = 'Am redirecționat cererea ta către un operator. Te rugăm să aștepți.';
    // Aici vei adăuga mai târziu logica de notificare a unui operator real
  } else {
    reply = 'Îmi pare rău, nu am înțeles întrebarea. Poți încerca să reformulezi?';
  }

  res.json({ reply });
});

export default router;