import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Users() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); userApi.getAll().then(r => setUsers(r.data.users)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleDelete = async (u) => {
    if (!confirm(`Delete user ${u.name}?`)) return;
    try { await userApi.delete(u._id); load(); } catch (e) { alert(e.response?.data?.message); }
  };

  const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Layout title="Users">
      <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/users/${u._id}/performance`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '.7rem' }}>{initials(u.name)}</div>
                      <span style={{ fontWeight: 600 }}>{u.name}{u._id === me._id && <span style={{ fontSize: '.68rem', color: 'var(--accent-light)', marginLeft: '.4rem' }}>(you)</span>}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                  <td style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.35rem' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/users/${u._id}/performance`)}>📊 Performance</button>
                      {u._id !== me._id ? <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button> : <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

