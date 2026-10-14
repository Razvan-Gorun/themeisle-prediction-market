import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Prediction Markets</Link>
        <div className="space-x-4">
          <Link to="/" className="hover:text-gray-300">Dashboard</Link>
          <Link to="/leaderboard" className="hover:text-gray-300">Clasament</Link>
          {user ? (
            <>
              <Link to="/profile" className="hover:text-gray-300">Profil</Link>
              <button onClick={logout} className="hover:text-gray-300">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-gray-300">Login</Link>
              <Link to="/register" className="hover:text-gray-300">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}