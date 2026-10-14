import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [activeBets, setActiveBets] = useState([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [resolvedBets, setResolvedBets] = useState([]);
  const [resolvedTotal, setResolvedTotal] = useState(0);
  const [resolvedPage, setResolvedPage] = useState(0);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingResolved, setLoadingResolved] = useState(false);
  const limit = 20;

  // Redirecționează dacă nu e autentificat
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Încarcă pariurile active
  const fetchActive = async (offset) => {
    setLoadingActive(true);
    try {
      const res = await fetch(`${__API_URL__}/profile/active?limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setActiveBets(data.data);
      setActiveTotal(data.total);
    } catch (error) {
      console.error('Eroare la încărcarea pariurilor active:', error);
    } finally {
      setLoadingActive(false);
    }
  };

  // Încarcă pariurile rezolvate
  const fetchResolved = async (offset) => {
    setLoadingResolved(true);
    try {
      const res = await fetch(`${__API_URL__}/profile/resolved?limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setResolvedBets(data.data);
      setResolvedTotal(data.total);
    } catch (error) {
      console.error('Eroare la încărcarea pariurilor rezolvate:', error);
    } finally {
      setLoadingResolved(false);
    }
  };

  // Reîncarcă datele când se schimbă pagina
  useEffect(() => {
    if (user) {
      fetchActive(activePage * limit);
      fetchResolved(resolvedPage * limit);
    }
  }, [user, activePage, resolvedPage]);

  if (loading) return <div className="p-4 text-center">Se încarcă...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Profilul meu</h1>
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p className="text-xl">Utilizator: <span className="font-semibold">{user.username}</span></p>
        <p className="text-xl">Sold: <span className="font-semibold">${user.balance}</span></p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Înapoi la piețe
        </button>
      </div>

      {/* Pariuri active */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Pariuri active</h2>
        {loadingActive ? (
          <p>Se încarcă...</p>
        ) : (
          <>
            <div className="space-y-4">
              {activeBets.map((bet) => (
                <div key={bet.id} className="border p-4 rounded shadow">
                  <h3 className="font-semibold">{bet.market_title}</h3>
                  <p>Ai pariat pe: <span className="font-medium">{bet.outcome_name}</span></p>
                  <p>Sumă: ${bet.amount}</p>
                  <p>Cota curentă: {bet.current_odds}</p>
                  <p>Data: {new Date(bet.placed_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            {activeTotal > limit && (
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setActivePage(p => Math.max(0, p - 1))}
                  disabled={activePage === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Pagina anterioară
                </button>
                <span>Pagina {activePage + 1} din {Math.ceil(activeTotal / limit)}</span>
                <button
                  onClick={() => setActivePage(p => p + 1)}
                  disabled={(activePage + 1) * limit >= activeTotal}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Pagina următoare
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Pariuri rezolvate */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Istoric pariuri</h2>
        {loadingResolved ? (
          <p>Se încarcă...</p>
        ) : (
          <>
            <div className="space-y-4">
              {resolvedBets.map((bet) => (
                <div key={bet.id} className="border p-4 rounded shadow">
                  <h3 className="font-semibold">{bet.market_title}</h3>
                  <p>Ai pariat pe: <span className="font-medium">{bet.outcome_name}</span></p>
                  <p>Sumă: ${bet.amount}</p>
                  <p>Rezultat: 
                    <span className={bet.result === 'won' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {bet.result === 'won' ? ' Câștigat' : ' Pierdut'}
                    </span>
                  </p>
                  {bet.payout > 0 && <p>Câștig: ${bet.payout}</p>}
                  <p>Data: {new Date(bet.placed_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            {resolvedTotal > limit && (
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setResolvedPage(p => Math.max(0, p - 1))}
                  disabled={resolvedPage === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Pagina anterioară
                </button>
                <span>Pagina {resolvedPage + 1} din {Math.ceil(resolvedTotal / limit)}</span>
                <button
                  onClick={() => setResolvedPage(p => p + 1)}
                  disabled={(resolvedPage + 1) * limit >= resolvedTotal}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Pagina următoare
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}