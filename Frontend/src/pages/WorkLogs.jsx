import './WorkLogs.css';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

const TASK_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#ec4899','#84cc16'];
const HOURS_AXIS = [10,11,12,13,14,15,16,17,18,19,20,21];
const TIMELINE_START = 9;
const TIMELINE_END = 22;
const TIMELINE_SPAN = (TIMELINE_END - TIMELINE_START) * 60;

function posFromTime(d) {
  const dt = new Date(d);
  const mins = dt.getHours() * 60 + dt.getMinutes() - TIMELINE_START * 60;
  return Math.max(0, Math.min(1, mins / TIMELINE_SPAN)) * 100;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '.6rem .8rem', fontSize: '.78rem' }}>
      <div style={{ fontWeight: 700 }}>{d.date}</div>
      <div style={{ color: 'var(--text-secondary)' }}>Work: {fmtHM(d.totalMinutes)}</div>
      <div style={{ color: 'var(--accent-light)' }}>Score: {d.score}/100</div>
    </div>
  );
}

export default function WorkLogs() {
  const navigate = useNavigate();
  const [chart, setChart] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [daily, setDaily] = useState(null);
  const [range, setRange] = useState(14);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);

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
    from.setDate(from.getDate() - (range - 1));

    Promise.all([
      worklogApi.getMyChart(fmt(from), fmt(to)),
      worklogApi.getMyTimeline(fmt(tlStart), fmt(tlEnd)),
      worklogApi.getMyHeatmap(12),
      worklogApi.getMyDaily(fmt(new Date())),
    ]).then(([cRes, tRes, hRes, dRes]) => {
      setChart(cRes.data.chart || []);
      setTimeline(tRes.data.timeline || []);
      setHeatmap(hRes.data.heatmap || []);
      setDaily(dRes.data.log);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [range, tlEnd]);

  const todayMins = daily?.totalMinutes || 0;
  const todayScore = daily?.productivityScore || 0;
  const todaySessions = daily?.sessions?.length || 0;

  // Build task color map for timeline
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

  // Heatmap grid — LeetCode style (weeks as columns, 7 rows each)
  const { heatmapWeeks, heatmapMonths, activeDays, maxStreak, totalSessions } = useMemo(() => {
    const map = {};
    heatmap.forEach(h => { map[h.date] = h; });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from ~12 months ago, aligned to Sunday
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
    let total = 0;

    const cursor = new Date(start);

    // Pad the first week if it doesn't start on Sunday
    const firstDay = cursor.getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(null); // empty padding
    }

    while (cursor <= today) {
      const key = cursor.toISOString().split('T')[0];
      const entry = map[key];
      const level = entry?.level || 0;
      const minutes = entry?.minutes || 0;

      if (level > 0) { active++; streak++; maxS = Math.max(maxS, streak); total++; }
      else { streak = 0; }

      // Track month labels at the start of each new month
      const m = cursor.getMonth();
      if (m !== lastMonth) {
        months.push({ month: cursor.toLocaleDateString('en-US', { month: 'short' }), weekIndex: weeks.length });
        lastMonth = m;
      }

      currentWeek.push({ date: key, level, minutes });

      // End of week (Saturday) — push and start new week
      if (cursor.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    // Pad last incomplete week with nulls
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return { heatmapWeeks: weeks, heatmapMonths: months, activeDays: active, maxStreak: maxS, totalSessions: total };
  }, [heatmap]);

  const tlPrev = () => { const d = new Date(tlEnd); d.setDate(d.getDate() - 7); setTlEnd(d); };
  const tlNext = () => { const d = new Date(tlEnd); d.setDate(d.getDate() + 7); if (d <= new Date()) setTlEnd(d); };

  if (loading) return <Layout title="Work Logs"><div className="page-loading"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="Work Logs">
      <div className="worklogs-page">
        {/* Banner */}
        <div className="wl-banner">
          🎯 Small efforts add up to big wins. Reset, refocus, and make today your best yet! 🚀✨
        </div>

        {/* Stats */}
        <div className="wl-stats">
          <div className="wl-stat-card">
            <div className="wl-stat-value accent">{fmtHM(todayMins)}</div>
            <div className="wl-stat-label">Today's Hours</div>
          </div>
          <div className="wl-stat-card">
            <div className="wl-stat-value success">{todayScore}/100</div>
            <div className="wl-stat-label">Productivity Score</div>
          </div>
          <div className="wl-stat-card">
            <div className="wl-stat-value warning">{todaySessions}</div>
            <div className="wl-stat-label">Sessions Today</div>
          </div>
          <div className="wl-stat-card">
            <div className="wl-stat-value">{daily?.breaks?.length || 0}</div>
            <div className="wl-stat-label">Breaks</div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="wl-chart-section">
          <div className="wl-chart-header">
            <h3>📊 Task Efforts</h3>
            <div className="wl-chart-toggle">
              {[7, 14, 30].map(r => (
                <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}d</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chart} barCategoryGap="20%">
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => { const d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }); }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}h`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} animationDuration={800}>
                {chart.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.totalMinutes)} />
                ))}
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
            {/* Day-of-week labels */}
            <div className="wl-heatmap-day-labels">
              {['','Mon','','Wed','','Fri',''].map((d, i) => (
                <div key={i} className="wl-heatmap-day-label">{d}</div>
              ))}
            </div>

            {/* Week columns */}
            <div className="wl-heatmap-columns">
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="wl-heatmap-col">
                  {week.map((cell, ci) => (
                    cell ? (
                      <div
                        key={ci}
                        className={`wl-heatmap-cell level-${cell.level}`}
                        onMouseEnter={() => setHoveredCell(`${wi}-${ci}`)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {hoveredCell === `${wi}-${ci}` && (
                          <div className="wl-tooltip">{cell.date}<br/>{fmtHM(cell.minutes)}</div>
                        )}
                      </div>
                    ) : (
                      <div key={ci} className="wl-heatmap-cell empty" />
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Month labels */}
          <div className="wl-heatmap-month-row">
            <div className="wl-heatmap-month-spacer" />
            {heatmapMonths.map((m, i) => {
              const nextIdx = heatmapMonths[i + 1]?.weekIndex ?? heatmapWeeks.length;
              const span = nextIdx - m.weekIndex;
              return (
                <div key={i} className="wl-heatmap-month-label" style={{ width: span * 15 }}>
                  {m.month}
                </div>
              );
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

        {/* Timeline */}
        <div className="wl-timeline-section">
          <div className="wl-timeline-header">
            <h3>📅 Task Report</h3>
            <div className="wl-date-nav">
              <button onClick={tlPrev}>◄</button>
              <span>{tlStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – {tlEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <button onClick={tlNext}>►</button>
            </div>
          </div>

          {/* Time axis */}
          <div className="wl-timeline-time-axis">
            <div />
            <div className="wl-timeline-hours">
              {HOURS_AXIS.map(h => <span key={h}>{h}:00</span>)}
            </div>
          </div>

          {/* Day rows */}
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
                      <div
                        key={si}
                        className="wl-timeline-block"
                        style={{ left: `${left}%`, width: `${width}%`, background: color }}
                        title={`${s.taskTitle} (${fmtHM(s.durationMinutes)})`}
                        onClick={() => s.task && navigate(`/tasks/${s.task}`)}
                      >
                        {width > 8 ? s.taskTitle : ''}
                      </div>
                    );
                  })}
                  {(day.breaks || []).map((b, bi) => {
                    const left = posFromTime(b.startTime);
                    const right = posFromTime(b.endTime);
                    return (
                      <div
                        key={`b${bi}`}
                        className="wl-timeline-break"
                        style={{ left: `${left}%`, width: `${Math.max(right - left, 0.3)}%` }}
                        title={`${b.type} break (${fmtHM(b.durationMinutes)})`}
                      />
                    );
                  })}
                  {day.totalMinutes === 0 && day.sessions?.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '.65rem', color: 'var(--text-muted)' }}>
                      No activity
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
