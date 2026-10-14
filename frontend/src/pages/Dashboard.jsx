import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [markets, setMarkets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'active',
    sort: 'createdAt',
    order: 'desc',
    limit: 20,
    offset: 0,
  });

  const fetchMarkets = async () => {
    setLoading(true);
    const params = new URLSearchParams(filters);
    try {
      // Modificare aici: folosim URL-ul complet
      const res = await fetch(`http://localhost:3000/markets?${params}`);
      const data = await res.json();
      setMarkets(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Eroare la încărcarea piețelor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5000);
    return () => clearInterval(interval);
  }, [filters]);

  const handleSortChange = (e) => {
    setFilters({ ...filters, sort: e.target.value });
  };

  const handleOrderChange = () => {
    setFilters({ ...filters, order: filters.order === 'desc' ? 'asc' : 'desc' });
  };

  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value, offset: 0 });
  };

  const nextPage = () => {
    if (filters.offset + filters.limit < total) {
      setFilters({ ...filters, offset: filters.offset + filters.limit });
    }
  };

  const prevPage = () => {
    if (filters.offset > 0) {
      setFilters({ ...filters, offset: filters.offset - filters.limit });
    }
  };

  if (loading && markets.length === 0) {
    return <div className="p-4 text-center">Se încarcă piețele...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">📈 Piețe de predicție</h1>

      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="border rounded px-3 py-2 bg-white shadow-sm"
        >
          <option value="active">Active</option>
          <option value="resolved">Rezolvate</option>
        </select>

        <select
          value={filters.sort}
          onChange={handleSortChange}
          className="border rounded px-3 py-2 bg-white shadow-sm"
        >
          <option value="createdAt">Data creării</option>
          <option value="total_value">Valoare totală</option>
          <option value="participants">Număr participanți</option>
        </select>

        <button
          onClick={handleOrderChange}
          className="border rounded px-4 py-2 bg-gray-100 hover:bg-gray-200 shadow-sm"
        >
          {filters.order === 'desc' ? '⬇️ Descrescător' : '⬆️ Crescător'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market) => (
          <div key={market.id} className="border rounded-lg shadow-lg p-5 bg-white">
            <h2 className="text-xl font-semibold mb-2">{market.title}</h2>
            <p className="text-gray-600 text-sm mb-3">Creat de: {market.creator_name}</p>

            <div className="space-y-2 mb-4">
              {market.outcomes?.map((outcome) => (
                <div key={outcome.id} className="bg-gray-50 p-2 rounded flex justify-between">
                  <span className="font-medium">{outcome.name}</span>
                  <span>${outcome.total_bet} (cota {outcome.odds})</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm text-gray-700">
              <span>💰 Valoare totală: ${market.total_value}</span>
              <span>👥 Participanți: {market.participants}</span>
            </div>

            <Link to={`/market/${market.id}`}>
              <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                Vezi detalii și plasează pariu
              </button>
            </Link>
          </div>
        ))}
      </div>

      {total > 0 && (
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={prevPage}
            disabled={filters.offset === 0}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            ⬅ Pagina anterioară
          </button>
          <span className="text-gray-700">
            Pagina {Math.floor(filters.offset / filters.limit) + 1} din {Math.ceil(total / filters.limit)}
          </span>
          <button
            onClick={nextPage}
            disabled={filters.offset + filters.limit >= total}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Pagina următoare ➔
          </button>
        </div>
      )}
    </div>
  );
}