import './UserPerformance.css';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { worklogApi } from '../api/endpoints';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function fmtHM(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

function getBarColor(mins) {
  if (mins >= 420) return '#22c55e';
  if (mins >= 240) return '#f59e0b';
  if (mins > 0) return '#ef4444';
  return '#1e293b';
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

const TASK_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#ec4899','#84cc16'];
const TIMELINE_START = 9;
const TIMELINE_END = 22;
const TIMELINE_SPAN = (TIMELINE_END - TIMELINE_START) * 60;
const HOURS_AXIS = [10,11,12,13,14,15,16,17,18,19,20,21];

function posFromTime(d) {
  const dt = new Date(d);
  const mins = dt.getHours() * 60 + dt.getMinutes() - TIMELINE_START * 60;
  return Math.max(0, Math.min(1, mins / TIMELINE_SPAN)) * 100;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '.6rem .8rem', fontSize: '.78rem' }}>
      <div style={{ fontWeight: 700 }}>{d.date}</div>
      <div style={{ color: 'var(--text-secondary)' }}>Work: {fmtHM(d.totalMinutes)}</div>
    </div>
  );
}

export default function UserPerformance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [chart, setChart] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [taskLogs, setTaskLogs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [logDate, setLogDate] = useState(new Date());

  // Timeline date range
  const [tlEnd, setTlEnd] = useState(new Date());
  const tlStart = useMemo(() => {
    const d = new Date(tlEnd);
    d.setDate(d.getDate() - 6);
    return d;
  }, [tlEnd]);

  const fmt = (d) => d.toISOString().split('T')[0];

  useEffect(() => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 13);

    Promise.all([
      worklogApi.getUserSummary(id),
      worklogApi.getUserChart(id, fmt(from), fmt(to)),
      worklogApi.getUserTimeline(id, fmt(tlStart), fmt(tlEnd)),
      worklogApi.getUserHeatmap(id, 12),
    ]).then(([sRes, cRes, tRes, hRes]) => {
      setSummary(sRes.data.summary);
      setUserInfo(sRes.data.user);
      setChart(cRes.data.chart || []);
      setTimeline(tRes.data.timeline || []);
      setHeatmap(hRes.data.heatmap || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, tlEnd]);

  // Task logs tab
  useEffect(() => {
    if (tab === 'tasklogs') {
      worklogApi.getUserTaskLogs(id, fmt(logDate))
        .then(r => setTaskLogs(r.data.logs || []))
        .catch(() => setTaskLogs([]));
    }
  }, [tab, logDate, id]);

  const taskColorMap = useMemo(() => {
    const map = {};
    let idx = 0;
    timeline.forEach(day => {
      (day.sessions || []).forEach(s => {
        if (!map[s.taskTitle]) { map[s.taskTitle] = TASK_COLORS[idx % TASK_COLORS.length]; idx++; }
      });
    });
    return map;
  }, [timeline]);

  const { heatmapWeeks, heatmapMonths, activeDays, maxStreak } = useMemo(() => {
    const map = {};
    heatmap.forEach(h => { map[h.date] = h; });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() - start.getDay());
    const weeks = [];
    const months = [];
    let currentWeek = [];
    let lastMonth = -1;
    let active = 0;
    let streak = 0;
    let maxS = 0;
    const cursor = new Date(start);
    const firstDay = cursor.getDay();
    for (let i = 0; i < firstDay; i++) currentWeek.push(null);
    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0];
      const entry = map[key];
      const level = entry?.level || 0;
      const minutes = entry?.minutes || 0;
      if (level > 0) { active++; streak++; maxS = Math.max(maxS, streak); } else { streak = 0; }
      const m = cursor.getMonth();
      if (m !== lastMonth) {
        months.push({ month: cursor.toLocaleDateString('en-US', { month: 'short' }), weekIndex: weeks.length });
        lastMonth = m;
      }
      currentWeek.push({ date: key, level, minutes });
      if (cursor.getDay() === 6) { weeks.push(currentWeek); currentWeek = []; }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) { while (currentWeek.length < 7) currentWeek.push(null); weeks.push(currentWeek); }
    return { heatmapWeeks: weeks, heatmapMonths: months, activeDays: active, maxStreak: maxS };
  }, [heatmap]);

  const tlPrev = () => { const d = new Date(tlEnd); d.setDate(d.getDate() - 7); setTlEnd(d); };
  const tlNext = () => { const d = new Date(tlEnd); d.setDate(d.getDate() + 7); if (d <= new Date()) setTlEnd(d); };
  const logPrev = () => { const d = new Date(logDate); d.setDate(d.getDate() - 1); setLogDate(d); };
  const logNext = () => { const d = new Date(logDate); d.setDate(d.getDate() + 1); if (d <= new Date()) setLogDate(d); };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return <Layout title="User Performance"><div className="page-loading"><div className="spinner" /></div></Layout>;
  if (!summary || !userInfo) return <Layout title="User Performance"><div className="empty-state">User not found.</div></Layout>;

  const s = summary;

  // All sessions from timeline for sessions tab
  const allSessions = [];
  timeline.forEach(day => {
    (day.sessions || []).forEach(sess => {
      allSessions.push({ ...sess, dayDate: day.date });
    });
  });
  allSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return (
    <Layout title="User Performance" actions={
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/users')}>← Back to Users</button>
    }>
      <div className="up-page">
        {/* Profile Header */}
        <div className="up-profile">
          <div className="up-avatar">{initials(userInfo.name)}</div>
          <div className="up-profile-info">
            <h2>{userInfo.name}</h2>
            <div className="up-profile-meta">
              <span>{userInfo.email}</span>
              <span className={`badge badge-${userInfo.role?.toLowerCase()}`}>{userInfo.role}</span>
              <span>Joined {new Date(userInfo.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="up-score-bar">
              <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>📊 Productivity</span>
              <div className="up-score-track">
                <div className="up-score-fill" style={{ width: `${s.overallScore}%`, background: getScoreColor(s.overallScore) }} />
              </div>
              <span className="up-score-label" style={{ color: getScoreColor(s.overallScore) }}>{s.overallScore}/100</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="up-summary">
          <div className="up-summary-card"><div className="up-sc-value" style={{ color: 'var(--info)' }}>{s.totalTasks}</div><div className="up-sc-label">Total Tasks</div></div>
          <div className="up-summary-card"><div className="up-sc-value" style={{ color: 'var(--success)' }}>{s.completed}</div><div className="up-sc-label">Completed</div></div>
          <div className="up-summary-card"><div className="up-sc-value" style={{ color: 'var(--warning)' }}>{s.inProgress}</div><div className="up-sc-label">In Progress</div></div>
          <div className="up-summary-card"><div className="up-sc-value" style={{ color: 'var(--accent)' }}>{s.totalWorkedHours}h</div><div className="up-sc-label">Total Hours</div></div>
          <div className="up-summary-card"><div className="up-sc-value">{s.avgDailyHours}h</div><div className="up-sc-label">Avg Daily</div></div>
          <div className="up-summary-card"><div className="up-sc-value" style={{ color: s.onTimeRate >= 80 ? 'var(--success)' : 'var(--danger)' }}>{s.onTimeRate}%</div><div className="up-sc-label">On-Time Rate</div></div>
        </div>

        {/* Tabs */}
        <div className="up-tabs">
          {['overview', 'timeline', 'sessions', 'tasklogs'].map(t => (
            <button key={t} className={`up-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? '📊 Overview' : t === 'timeline' ? '📅 Timeline' : t === 'sessions' ? '📋 Sessions' : '📝 Task Logs'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <>
            {/* Chart */}
            <div className="wl-chart-section">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Work Hours (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chart} barCategoryGap="20%">
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}h`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]} animationDuration={800}>
                    {chart.map((e, i) => <Cell key={i} fill={getBarColor(e.totalMinutes)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Heatmap — LeetCode style */}
            <div className="wl-heatmap-section">
              <div className="wl-heatmap-header">
                <h3>🗓 Activity Heatmap</h3>
                <div className="wl-heatmap-header-stats">
                  <span>Total active days: <strong>{activeDays}</strong></span>
                  <span>Max streak: <strong>{maxStreak}</strong></span>
                </div>
              </div>
              <div className="wl-heatmap-wrapper">
                <div className="wl-heatmap-day-labels">
                  {['','Mon','','Wed','','Fri',''].map((d, i) => (
                    <div key={i} className="wl-heatmap-day-label">{d}</div>
                  ))}
                </div>
                <div className="wl-heatmap-columns">
                  {heatmapWeeks.map((week, wi) => (
                    <div key={wi} className="wl-heatmap-col">
                      {week.map((cell, ci) => (
                        cell ? (
                          <div key={ci} className={`wl-heatmap-cell level-${cell.level}`} title={`${cell.date} — ${fmtHM(cell.minutes)}`} />
                        ) : (
                          <div key={ci} className="wl-heatmap-cell empty" />
                        )
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="wl-heatmap-month-row">
                <div className="wl-heatmap-month-spacer" />
                {heatmapMonths.map((m, i) => {
                  const nextIdx = heatmapMonths[i + 1]?.weekIndex ?? heatmapWeeks.length;
                  const span = nextIdx - m.weekIndex;
                  return <div key={i} className="wl-heatmap-month-label" style={{ width: span * 15 }}>{m.month}</div>;
                })}
              </div>
              <div className="wl-heatmap-footer">
                <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>Work activity in the past one year</span>
                <div className="wl-heatmap-legend">
                  <span>Less</span>
                  {[0,1,2,3,4].map(l => <div key={l} className={`wl-heatmap-cell level-${l}`} style={{ width: 11, height: 11 }} />)}
                  <span>More</span>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'timeline' && (
          <div className="wl-timeline-section">
            <div className="wl-timeline-header">
              <h3>📅 Task Report</h3>
              <div className="wl-date-nav">
                <button onClick={tlPrev}>◄</button>
                <span>{tlStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – {tlEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <button onClick={tlNext}>►</button>
              </div>
            </div>
            <div className="wl-timeline-time-axis">
              <div />
              <div className="wl-timeline-hours">{HOURS_AXIS.map(h => <span key={h}>{h}:00</span>)}</div>
            </div>
            {timeline.map((day, di) => {
              const d = new Date(day.date);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
              return (
                <div key={di} className="wl-timeline-row">
                  <div className="wl-timeline-day-label">
                    <span className="day-name">{dayName}</span>
                    <span className="day-hours">{fmtHM(day.totalMinutes)}</span>
                  </div>
                  <div className="wl-timeline-bar-container">
                    {(day.sessions || []).map((s, si) => {
                      const left = posFromTime(s.startTime);
                      const right = s.endTime ? posFromTime(s.endTime) : posFromTime(new Date());
                      const width = Math.max(right - left, 0.5);
                      const color = taskColorMap[s.taskTitle] || TASK_COLORS[0];
                      return (
                        <div key={si} className="wl-timeline-block" style={{ left: `${left}%`, width: `${width}%`, background: color }} title={`${s.taskTitle} (${fmtHM(s.durationMinutes)})`} onClick={() => s.task && navigate(`/tasks/${s.task}`)}>
                          {width > 8 ? s.taskTitle : ''}
                        </div>
                      );
                    })}
                    {(day.breaks || []).map((b, bi) => {
                      const left = posFromTime(b.startTime);
                      const right = posFromTime(b.endTime);
                      return <div key={`b${bi}`} className="wl-timeline-break" style={{ left: `${left}%`, width: `${Math.max(right - left, 0.3)}%` }} title={`${b.type} break (${fmtHM(b.durationMinutes)})`} />;
                    })}
                    {day.totalMinutes === 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '.65rem', color: 'var(--text-muted)' }}>No activity</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'sessions' && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Work Sessions</h3>
            <div className="table-wrapper">
              <table className="up-sessions-table">
                <thead>
                  <tr><th>Task</th><th>Project</th><th>Date</th><th>Start</th><th>End</th><th>Duration</th></tr>
                </thead>
                <tbody>
                  {allSessions.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sessions found</td></tr>
                  ) : allSessions.map((s, i) => (
                    <tr key={i} style={{ cursor: 'pointer' }} onClick={() => s.task && navigate(`/tasks/${s.task}`)}>
                      <td style={{ fontWeight: 600 }}>{s.taskTitle}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.projectName}</td>
                      <td style={{ fontSize: '.75rem' }}>{new Date(s.startTime).toLocaleDateString()}</td>
                      <td style={{ fontSize: '.75rem' }}>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ fontSize: '.75rem' }}>{s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="up-session-active">ACTIVE</span>}</td>
                      <td style={{ fontWeight: 600 }}>{fmtHM(s.durationMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'tasklogs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <div className="wl-date-nav">
                <button onClick={logPrev}>◄</button>
                <span>{logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <button onClick={logNext}>►</button>
              </div>
            </div>
            <div className="tl-entries">
              {taskLogs.length === 0 ? (
                <div className="tl-empty">No task logs for this date.</div>
              ) : taskLogs.map((log, i) => (
                <div key={i} className={`tl-entry ${log.status?.toLowerCase()}`} onClick={() => navigate(`/tasks/${log.taskId}`)}>
                  <div className="tl-entry-title">Task Work — <strong>{log.taskTitle}</strong> | Status <strong>{log.status}</strong></div>
                  <div className="tl-entry-meta">
                    <span>{new Date(log.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    {log.durationMinutes && <span>{fmtHM(log.durationMinutes)}</span>}
                  </div>
                  <span className="tl-entry-badge">TASK</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
