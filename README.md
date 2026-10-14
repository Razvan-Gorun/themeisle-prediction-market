# Aplicație Predicții Piață 

Aplicație web pentru piețe de predicție: utilizatorii pot plasa pariuri, administratorii pot rezolva piețe și distribui câștiguri. Include asistent virtual (chat).

## Cum rulezi aplicația

### 1. Clonează repository-ul
```bash
git clone <url>
cd themeisle-prediction-market
2. Instalează dependențele
Important: Folderele node_modules nu sunt incluse. Rulează comenzile de mai jos.

Backend

cd backend-node
npm install

Frontend

cd ../frontend
npm install
3. Pregătește baza de date (SQLite)
În folderul backend-node:


npm run db:init   # creează tabelele
npm run db:seed   # adaugă date de test
4. Pornește serverele
Backend (în backend-node)

npm run dev
Rulează pe http://localhost:3000

Frontend (în frontend, alt terminal)

npm run dev
Rulează pe http://localhost:5173

Credențiale implicite
Admin: admin / admin

Utilizator: user / user

Funcționalități principale
Tablou de bord cu piețe (filtre, sortare, paginare, actualizare periodică)

Autentificare (înregistrare, login, logout)

Profil utilizator (pariuri active și istoric, paginare separată)

Pagină detalii piață (grafic pie, cote, plasare pariu)

Clasament utilizatori după câștiguri

Administrator: rezolvă piețe, distribuie câștiguri

Asistent virtual (chat) – răspunde la întrebări uzuale

Cum testezi
Autentifică-te ca admin/admin.

Intră pe o piață, plasează un pariu.

Verifică profilul – pariul apare la „Pariuri active”.

(Admin) Pe aceeași piață, apasă „Rezolvă piața” și introdu ID-ul opțiunii câștigătoare (ex: 1). După rezolvare, pariul trece în istoric, soldul se actualizează.

Accesează Clasament.

Deschide chatul (colț dreapta jos) și scrie „salut”, „sold”, „pariu”.

Tehnologii
Backend: Node.js, Express, TypeScript, SQLite (better-sqlite3)

Frontend: React, Vite, Tailwind CSS, React Router, Recharts
