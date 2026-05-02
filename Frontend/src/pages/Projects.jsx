import './Projects.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({ name: project?.name || '', description: project?.description || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (project) await projectApi.update(project._id, form);
      else await projectApi.create(form);
      onSave();
    } catch (err) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{project ? 'Edit Project' : 'New Project'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : project ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberModal({ project, allUsers, onClose, onSave }) {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const memberIds = project.members.map(m => m._id);
  const available = allUsers.filter(u => !memberIds.includes(u._id));
  const handleAdd = async () => {
    if (!userId) return; setLoading(true);
    try { await projectApi.addMember(project._id, userId); onSave(); }
    catch (e) { alert(e.response?.data?.message); setLoading(false); }
  };
  const handleRemove = async (uid) => {
    setLoading(true);
    try { await projectApi.removeMember(project._id, uid); onSave(); }
    catch (e) { alert(e.response?.data?.message); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3>Members — {project.name}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem' }}>
          <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)} style={{ flex: 1 }}>
            <option value="">Select user…</option>
            {available.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!userId || loading}>Add</button>
        </div>
        {project.members.map(m => (
          <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem .75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '.4rem' }}>
            <div><span style={{ fontWeight: 600, fontSize: '.85rem' }}>{m.name}</span><span style={{ color: 'var(--text-muted)', fontSize: '.72rem', marginLeft: '.5rem' }}>{m.email}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span className={`badge badge-${m.role?.toLowerCase()}`}>{m.role}</span>
              {m._id !== project.owner?._id && <button className="btn btn-danger btn-sm" onClick={() => handleRemove(m._id)} disabled={loading}>Remove</button>}
            </div>
          </div>
        ))}
        <div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    const [pRes, uRes] = await Promise.allSettled([
      projectApi.getAll(),
      isAdmin ? userApi.getAll() : Promise.resolve({ data: { users: [] } }),
    ]);
    if (pRes.status === 'fulfilled') setProjects(pRes.value.data.projects);
    if (uRes.status === 'fulfilled') setAllUsers(uRes.value.data.users);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try { await projectApi.delete(id); load(); } catch (e) { alert(e.response?.data?.message); }
  };

  const close = () => setModal(null);
  const save = () => { close(); load(); };

  return (
    <Layout title={isAdmin ? 'Projects' : 'My Projects'} actions={isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setModal({ type: 'create' })}>+ New Project</button>}>
      {modal?.type === 'create' && <ProjectModal onClose={close} onSave={save} />}
      {modal?.type === 'edit' && <ProjectModal project={modal.project} onClose={close} onSave={save} />}
      {modal?.type === 'members' && <MemberModal project={modal.project} allUsers={allUsers} onClose={close} onSave={save} />}

      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        projects.length === 0 ? <div className="empty-state"><p style={{ fontWeight: 600 }}>No projects yet</p><p>{isAdmin ? 'Create your first project.' : "You haven't been added to any project."}</p></div> : (
          <div className="grid-3">
            {projects.map(p => (
              <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
                <div className="project-card-header">
                  <div className="project-card-title">{p.name}</div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '.25rem' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({ type: 'members', project: p })} title="Members">👥</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({ type: 'edit', project: p })} title="Edit">✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(p._id)} title="Delete">🗑️</button>
                    </div>
                  )}
                </div>
                <p className="project-card-desc">{p.description || 'No description.'}</p>
                <div className="project-members">
                  <div className="member-avatars">
                    {p.members.slice(0, 4).map(m => <div key={m._id} className="member-avatar" title={m.name}>{m.name.charAt(0).toUpperCase()}</div>)}
                  </div>
                  <span style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{p.members.length} member{p.members.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </Layout>
  );
}
