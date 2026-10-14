import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function MarketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${__API_URL__}/markets/${id}`);
      const data = await res.json();
      setMarket(data);
    } catch (error) {
      console.error('Eroare la încărcarea pieței:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, [id]);

  const handleBet = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedOutcome) {
      setError('Selectează un rezultat');
      return;
    }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Suma trebuie să fie un număr pozitiv');
      return;
    }

    try {
      const res = await fetch(`${__API_URL__}/markets/${id}/bets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ outcomeId: selectedOutcome, amount })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Pariu plasat cu succes!');
        setBetAmount('');
        setSelectedOutcome(null);
        fetchMarket(); // reîncarcă datele pieței
      } else {
        setError(data.error || 'Eroare la plasarea pariului');
      }
    } catch (error) {
      setError('Eroare de rețea');
    }
  };

  const handleResolve = async () => {
    if (!user || user.role !== 'admin') return;
    const winningOutcomeId = prompt('Introdu ID-ul outcome-ului câștigător:');
    if (!winningOutcomeId) return;

    try {
      const res = await fetch(`${__API_URL__}/markets/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ winningOutcomeId: parseInt(winningOutcomeId) })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Piața a fost rezolvată!');
        fetchMarket();
      } else {
        alert(data.error || 'Eroare');
      }
    } catch (error) {
      alert('Eroare de rețea');
    }
  };

  const prepareChartData = (outcomes) => {
    return outcomes.map(o => ({
      name: o.name,
      value: o.total_bet,
    }));
  };

  if (loading) return <div className="p-4 text-center">Se încarcă...</div>;
  if (!market) return <div className="p-4 text-center">Piața nu există</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{market.title}</h1>
      <p className="text-gray-600 mb-2">Creat de: {market.creator_name}</p>
      <p className="text-gray-600 mb-4">Status: {market.status === 'active' ? 'Activă' : 'Rezolvată'}</p>

      {market.status === 'resolved' && (
        <div className="bg-yellow-100 p-4 rounded mb-4">
          <p className="font-bold">Rezultat câștigător: {market.resolution_outcome}</p>
        </div>
      )}

      {user?.role === 'admin' && market.status === 'active' && (
        <button
          onClick={handleResolve}
          className="mb-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Rezolvă piața (admin)
        </button>
      )}

      {/* Grafic */}
      {market.outcomes && market.outcomes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Distribuția pariurilor</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={prepareChartData(market.outcomes)}
              cx={200}
              cy={150}
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {market.outcomes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${value}`} />
            <Legend />
          </PieChart>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lista opțiuni */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Opțiuni</h2>
          <div className="space-y-2">
            {market.outcomes.map((outcome) => (
              <div
                key={outcome.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedOutcome === outcome.id ? 'bg-blue-100 border-blue-500' : ''
                }`}
                onClick={() => setSelectedOutcome(outcome.id)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{outcome.name}</span>
                  <span>Cota: {outcome.odds}</span>
                </div>
                <div className="text-sm text-gray-600">Total pariat: ${outcome.total_bet}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Formular plasare pariu */}
        {market.status === 'active' && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Plasează pariu</h2>
            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-3">{success}</div>}
            <form onSubmit={handleBet}>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Sumă ($)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="w-full border rounded p-2"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                disabled={!selectedOutcome}
              >
                Plasează pariu
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}