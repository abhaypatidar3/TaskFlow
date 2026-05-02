import './TaskDetail.css';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskApi, projectApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = (Date.now() - new Date(startTime).getTime()) / 1000;
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = Math.floor(diff % 60);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return <span className="timer-display timer-active">{elapsed}</span>;
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState([]);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await taskApi.getById(id);
      setTask(data.task);
      setStatus(data.task.status);
      // Load project members for reassign dropdown
      if (data.task.project?._id) {
        try {
          const pRes = await projectApi.getById(data.task.project._id);
          setMembers(pRes.data.project.members || []);
        } catch { /* ignore */ }
      }
    } catch { navigate(-1); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Layout title="Loading..."><div className="page-loading"><div className="spinner" /></div></Layout>;
  if (!task) return null;

  const isAssignee = task.assignee?._id === user?.id || task.assignee?._id === user?._id;
  const canInteract = isAdmin || isAssignee;

  const hasActiveTimer = task.workSessions?.some(s => !s.endTime);
  const activeSession = hasActiveTimer ? task.workSessions.find(s => !s.endTime) : null;

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const payload = { text: comment.trim() };
      if (status !== task.status) payload.status = status;
      await taskApi.addComment(id, payload);
      setComment('');
      await load();
    } catch (e) { alert(e.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const handleStart = async () => {
    try { await taskApi.startWork(id); await load(); } catch (e) { alert(e.response?.data?.message); }
  };

  const handleStop = async () => {
    try { await taskApi.stopWork(id); await load(); } catch (e) { alert(e.response?.data?.message); }
  };

  const handleReassign = async (newId) => {
    try { await taskApi.reassign(id, newId || null); await load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to reassign.'); }
  };

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <Layout title={task.title} actions={
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
    }>
      <div className="task-detail">
        {/* Main content */}
        <div className="task-main">
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '.75rem' }}>Description</h3>
            <p style={{ fontSize: '.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Activity log */}
          <div className="card">
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>Activity ({task.comments?.length || 0})</h3>
            <div className="activity-log">
              {task.comments?.map((c, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-avatar">{initials(c.user?.name)}</div>
                  <div className="activity-body">
                    <div className="activity-header">
                      <span className="activity-user">{c.user?.name || 'System'}</span>
                      <span className="activity-time">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className={`activity-text ${c.type === 'system' || c.type === 'assignee_change' ? 'system' : ''}`}>{c.text}</div>
                    {c.status && <span className={`badge badge-${c.status.toLowerCase()}`} style={{ marginTop: '.3rem' }}>{c.status.replace('_', ' ')}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment box */}
            {canInteract && (
              <div className="comment-box">
                <textarea className="form-textarea" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
                <div className="comment-actions">
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 'auto' }}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CLOSED">Closed</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleComment} disabled={submitting || !comment.trim()}>
                    {submitting ? 'Posting...' : status !== task.status ? `Comment + ${status}` : 'Post Comment'}
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Sidebar: Info + Reassign + Timer */}
        <div className="task-sidebar-info">
          {/* Info card */}
          <div className="card">
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>Info</h3>
            <div className="info-row"><span className="info-label">Status</span><span className={`badge badge-${task.status?.toLowerCase()}`}>{task.status?.replace('_', ' ')}</span></div>
            <div className="info-row"><span className="info-label">Priority</span><span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span></div>
            <div className="info-row"><span className="info-label">Project</span><span className="info-value">{task.project?.name}</span></div>
            <div className="info-row"><span className="info-label">Created By</span><span className="info-value">{task.creator?.name}</span></div>

            {/* Assignee with reassign dropdown */}
            <div className="info-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="info-label">Assigned To</span>
                <span className="info-value">{task.assignee?.name || 'Unassigned'}</span>
              </div>
              {canInteract && members.length > 0 && (
                <select
                  className="form-select"
                  value={task.assignee?._id || ''}
                  onChange={e => handleReassign(e.target.value)}
                  style={{ fontSize: '.75rem', padding: '.35rem .5rem' }}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="info-row"><span className="info-label">Est. Hours</span><span className="info-value">{task.estimatedHours || 0}h</span></div>
            <div className="info-row"><span className="info-label">Worked</span><span className="info-value">{formatDuration(task.workedHours || 0)}</span></div>
            {task.dueDate && <div className="info-row"><span className="info-label">Due Date</span><span className="info-value">{new Date(task.dueDate).toLocaleDateString()}</span></div>}
            <div className="info-row"><span className="info-label">Created</span><span className="info-value">{new Date(task.createdAt).toLocaleDateString()}</span></div>
          </div>

          {/* Time tracking card — below info */}
          {canInteract && (
            <div className="card">
              <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.75rem' }}>⏱ Time Tracking</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {hasActiveTimer ? (
                  <>
                    <LiveTimer startTime={activeSession?.startTime} />
                    {isAssignee && <button className="btn btn-danger btn-sm" onClick={handleStop}>⏹ Stop</button>}
                  </>
                ) : (
                  <>
                    <span className="timer-display" style={{ color: 'var(--text-muted)' }}>{formatDuration(task.workedHours || 0)}</span>
                    {isAssignee && !['CLOSED', 'COMPLETED'].includes(task.status) && (
                      <button className="btn btn-success btn-sm" onClick={handleStart}>▶ Start</button>
                    )}
                  </>
                )}
              </div>

              {/* Progress bar */}
              {task.estimatedHours > 0 && (() => {
                const worked = task.workedHours || 0;
                const est = task.estimatedHours;
                const pct = Math.min((worked / est) * 100, 100);
                const isOver = worked > est;
                const remaining = est - worked;
                const exceeded = worked - est;
                const barColor = pct >= 100 ? 'var(--danger)' : pct >= 75 ? 'var(--warning)' : 'var(--success)';
                return (
                  <div style={{ marginTop: '.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                      <span>{formatDuration(worked)} / {est}h</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width .4s ease' }} />
                    </div>
                    <div style={{ marginTop: '.5rem', padding: '.4rem .6rem', borderRadius: 'var(--radius-sm)', background: isOver ? 'var(--danger-bg)' : 'var(--success-bg)', border: `1px solid ${isOver ? 'rgba(239,68,68,.25)' : 'rgba(34,197,94,.25)'}` }}>
                      {isOver ? (
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                          🔴 Time Exceeded: {formatDuration(exceeded)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--success)' }}>
                          ⏳ Time Remaining: {formatDuration(remaining)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Session history */}
              {task.workSessions?.length > 0 && (
                <details style={{ marginTop: '.75rem' }}>
                  <summary style={{ fontSize: '.72rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                    Sessions ({task.workSessions.length})
                  </summary>
                  <div style={{ marginTop: '.4rem', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                    {task.workSessions.slice().reverse().map((s, i) => {
                      const dur = s.endTime
                        ? ((new Date(s.endTime) - new Date(s.startTime)) / 3600000)
                        : ((Date.now() - new Date(s.startTime).getTime()) / 3600000);
                      return (
                        <div key={i} style={{ fontSize: '.7rem', color: 'var(--text-secondary)', padding: '.25rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {new Date(s.startTime).toLocaleDateString()} {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: 'var(--success)', fontWeight: 700 }}>running</span>}
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatDuration(dur)}</span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
