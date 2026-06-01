import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  Users, CheckCircle2, FileText, TrendingUp, ArrowRight, RefreshCw, 
  Trash2, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

const COLORS = {
  GTM: '#3b82f6',     // Blue
  Sales: '#10b981',   // Emerald
  Pricing: '#f59e0b', // Amber
  Brand: '#ec4899',   // Pink
  Ops: '#8b5cf6',     // Violet
  Unclassified: '#9ca3af' // Gray
};

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/sessions`);
      setSessions(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to connect to backend server. Make sure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await axios.delete(`${API_BASE}/sessions/${id}`);
      fetchSessions();
    } catch (err) {
      alert('Failed to delete session: ' + err.message);
    }
  };

  // Compute metrics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'active').length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalBriefs = sessions.filter(s => s.briefId !== null).length;

  // Compute bucket distribution
  const bucketCounts = { GTM: 0, Sales: 0, Pricing: 0, Brand: 0, Ops: 0 };
  sessions.forEach(s => {
    if (s.status === 'completed' && bucketCounts[s.bucket] !== undefined) {
      bucketCounts[s.bucket]++;
    }
  });

  const chartData = Object.keys(bucketCounts).map(key => ({
    name: key,
    value: bucketCounts[key]
  }));

  const pieData = chartData.filter(d => d.value > 0);

  // Determine top bottleneck
  let topBottleneck = 'None';
  let maxCount = 0;
  Object.entries(bucketCounts).forEach(([bucket, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topBottleneck = bucket;
    }
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Strategy Intake Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time founder classification, SPIN funnel conversions, and strategic brief delivery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <Link
            to="/chat"
            className="flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-medium transition shadow-md shadow-brand-500/20"
          >
            Start New Session
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Discovery Chats</span>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">{activeSessions}</span>
            <p className="text-xs text-gray-400 mt-1">Founders currently in discovery</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Sessions</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">{completedSessions}</span>
            <p className="text-xs text-gray-400 mt-1">Conversions to classification</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Strategy Briefs Generated</span>
            <FileText className="h-5 w-5 text-pink-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">{totalBriefs}</span>
            <p className="text-xs text-gray-400 mt-1">1-page strategic guides ready</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-black/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Bottleneck Bucket</span>
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">{topBottleneck}</span>
            <p className="text-xs text-gray-400 mt-1">Max index frequency of problems</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-bold tracking-tight mb-4">Challenge Bucket Distribution</h2>
          <div className="h-80 w-full">
            {totalSessions === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                No data available. Start a session or run evaluation.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                      borderRadius: '8px', 
                      border: 'none', 
                      color: '#fff' 
                    }} 
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart / Overview */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <h2 className="text-lg font-bold tracking-tight mb-4">Session Composition</h2>
          <div className="h-56 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">No completed sessions</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-4">
            {Object.keys(COLORS).filter(k => k !== 'Unclassified').map(bucket => (
              <div key={bucket} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[bucket] }} />
                  <span className="font-medium">{bucket} Strategy</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400 font-bold">{bucketCounts[bucket]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Recent Discovery Sessions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Resume active conversations or inspect completed strategic outputs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400">
              No sessions found. Kick off a strategy consultation call above.
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-6 py-3 font-semibold">Founder & Company</th>
                  <th className="px-6 py-3 font-semibold">Evaluation Persona</th>
                  <th className="px-6 py-3 font-semibold">Discovery Progress</th>
                  <th className="px-6 py-3 font-semibold">Classification Bucket</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sessions.map((session) => (
                  <tr key={session.sessionId} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{session.founderName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{session.companyName}</div>
                    </td>
                    <td className="px-6 py-4">
                      {session.personaName ? (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200/30">
                          <Award className="h-3 w-3" />
                          {session.personaName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Organic Site Visitor</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'active' ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-500 font-medium">Question {session.currentQuestionIndex} of 8</span>
                            <span>{Math.round((session.currentQuestionIndex / 8) * 100)}%</span>
                          </div>
                          <div className="w-24 bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${(session.currentQuestionIndex / 8) * 100}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200/30">
                          Completed (8/8)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'completed' ? (
                        <span 
                          className="inline-flex items-center rounded px-2.5 py-0.5 text-xs font-semibold uppercase border"
                          style={{ 
                            backgroundColor: `${COLORS[session.bucket]}15`, 
                            borderColor: `${COLORS[session.bucket]}40`,
                            color: COLORS[session.bucket]
                          }}
                        >
                          {session.bucket}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Determining...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {session.status === 'active' ? (
                          <Link
                            to={`/chat?sessionId=${session.sessionId}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            Resume Chat
                          </Link>
                        ) : (
                          <Link
                            to={`/chat?sessionId=${session.sessionId}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            View Brief
                          </Link>
                        )}
                        <button
                          onClick={(e) => handleDelete(session.sessionId, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Delete Session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
