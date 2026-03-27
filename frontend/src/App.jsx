import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, email: payload.email });
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Link<span className="text-cyan-400">Vault</span></h2>
        <p className="text-slate-400 text-center mb-6">Short links that pay you</p>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full p-3 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full p-3 mb-6 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none" />
          <button type="submit" disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg transition-all">
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4 text-slate-400">
          Don't have an account? <Link to="/register" className="text-cyan-400">Register</Link>
        </p>
      </div>
    </div>
  );
}

function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Link<span className="text-cyan-400">Vault</span></h2>
        <p className="text-slate-400 text-center mb-6">Start earning from your links</p>
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full p-3 mb-4 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            className="w-full p-3 mb-6 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none" />
          <button type="submit" disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg transition-all">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-4 text-slate-400">
          Already have an account? <Link to="/login" className="text-cyan-400">Login</Link>
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({ totalClicks: 0, estimatedEarnings: '0.00' });
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [linksRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/links`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/analytics/summary`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setLinks(linksRes.data);
      setStats(statsRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createLink = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/links`, { originalUrl: newUrl }, { headers: { Authorization: `Bearer ${token}` } });
      setNewUrl('');
      fetchData();
    } catch (e) { alert('Failed to create link'); }
  };

  const deleteLink = async (id) => {
    if (!confirm('Delete this link?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/links/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (e) { alert('Failed to delete'); }
  };

  const copyLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/${code}`);
    alert('Link copied!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Link<span className="text-cyan-400">Vault</span></h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">{user?.email}</span>
            <button onClick={logout} className="text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm">Total Clicks</p>
            <p className="text-3xl font-bold text-cyan-400">{stats.totalClicks}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm">Active Links</p>
            <p className="text-3xl font-bold text-green-400">{stats.totalLinks || 0}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm">Estimated Earnings</p>
            <p className="text-3xl font-bold text-yellow-400">${stats.estimatedEarnings}</p>
          </div>
        </div>

        {/* Create Link */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Link</h2>
          <form onSubmit={createLink} className="flex gap-4">
            <input type="url" placeholder="Paste your URL here..." value={newUrl} onChange={e => setNewUrl(e.target.value)} required
              className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none" />
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-6 py-3 rounded-lg">
              Shorten
            </button>
          </form>
        </div>

        {/* Links List */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Your Links</h2>
          <div className="space-y-3">
            {links.map(link => (
              <div key={link._id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{link.originalUrl}</p>
                  <p className="text-cyan-400 text-sm">
                    {window.location.origin}/{link.shortCode}
                    <span className="text-slate-400 ml-2">({link.clicks} clicks)</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyLink(link.shortCode)} className="text-slate-400 hover:text-white px-3 py-1">Copy</button>
                  <button onClick={() => deleteLink(link._id)} className="text-red-400 hover:text-red-300 px-3 py-1">Delete</button>
                </div>
              </div>
            ))}
            {links.length === 0 && <p className="text-slate-400 text-center py-8">No links yet. Create your first one above!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

export default App;
