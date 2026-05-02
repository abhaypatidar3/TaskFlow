import './TaskLogs.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { worklogApi, projectApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function fmtHM(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

export default function TaskLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  const fmt = (d) => d.toISOString().split('T')[0];

  useEffect(() => {
    projectApi.getAll().then(r => setProjects(r.data.projects || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    worklogApi.getMyTaskLogs(fmt(date), selectedProject || undefined)
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [date, selectedProject]);

  const prevDay = () => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d); };
  const nextDay = () => { const d = new Date(date); d.setDate(d.getDate() + 1); if (d <= new Date()) setDate(d); };

  const totalMins = logs.reduce((s, l) => s + (l.durationMinutes || 0), 0);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Layout title="Task Logs">
      <div className="tasklogs-page">
        <div className="tl-header">
          <h2>Work Logs</h2>
          <div className="tl-header-right">
            <select className="form-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ fontSize: '.78rem' }}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <div className="wl-date-nav">
              <button onClick={prevDay}>◄</button>
              <span className="tl-date-display">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <button onClick={nextDay}>►</button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="tl-summary">
          <div className="tl-summary-item">Total Time: <strong>{fmtHM(totalMins)}</strong></div>
          <div className="tl-summary-item">Sessions: <strong>{logs.length}</strong></div>
          <div className="tl-summary-item">Tasks: <strong>{new Set(logs.map(l => l.taskId)).size}</strong></div>
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : logs.length === 0 ? (
          <div className="tl-empty">No work logs found for {dateStr}.</div>
        ) : (
          <div className="tl-entries">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`tl-entry ${log.status?.toLowerCase() || ''}`}
                onClick={() => navigate(`/tasks/${log.taskId}`)}
              >
                <div className="tl-entry-title">
                  Task Work — <strong>{log.taskTitle}</strong> | Status <strong>{log.status}</strong> | ID {log.taskId?.slice(-4)}
                </div>
                <div className="tl-entry-meta">
                  <span>{new Date(log.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>{new Date(log.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  {log.durationMinutes && <span>Duration: {fmtHM(log.durationMinutes)}</span>}
                </div>
                <span className="tl-entry-badge">TASK</span>
                <span className="tl-entry-edit" onClick={e => { e.stopPropagation(); navigate(`/tasks/${log.taskId}`); }}>✏️</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
