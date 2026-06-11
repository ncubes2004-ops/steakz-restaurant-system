import { useEffect, useState } from 'react';
import api from '../api/axios';

interface User { id: number; name: string; email: string; role: string; isActive: boolean; branchId?: number; salary?: number; branch?: { name: string } }
interface Branch { id: number; name: string; address: string; isActive: boolean }

const ROLES = ['ADMIN', 'HQ_MANAGER', 'BRANCH_MANAGER', 'CHEF', 'CASHIER', 'CUSTOMER'];

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPass, setUPass] = useState('');
  const [uRole, setURole] = useState('CASHIER');
  const [uBranch, setUBranch] = useState('');
  const [uSalary, setUSalary] = useState('');
  const [uMsg, setUMsg] = useState('');
  const [bName, setBName] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bMsg, setBMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    api.get('/admin/users').then((r) => setUsers(r.data));
    api.get('/admin/branches').then((r) => setBranches(r.data));
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setUMsg('');
    try {
      await api.post('/admin/users', {
        name: uName,
        email: uEmail,
        password: uPass,
        role: uRole,
        branchId: uBranch ? parseInt(uBranch, 10) : undefined,
        salary: uSalary ? parseFloat(uSalary) : undefined,
      });
      setUMsg('User created successfully!');
      setUName(''); setUEmail(''); setUPass(''); setUBranch(''); setUSalary('');
      loadAll();
    } catch (err: any) {
      setUMsg(err.response?.data?.error ?? 'Failed.');
    }
  }

  async function addBranch(e: React.FormEvent) {
    e.preventDefault();
    setBMsg('');
    try {
      await api.post('/admin/branches', { name: bName, address: bAddress });
      setBMsg('Location added!');
      setBName(''); setBAddress('');
      loadAll();
    } catch (err: any) {
      setBMsg(err.response?.data?.error ?? 'Failed.');
    }
  }

  async function changeRole(id: number, role: string) {
    const branchId = users.find((u) => u.id === id)?.branchId;
    await api.patch(`/admin/users/${id}/role`, { role, branchId });
    loadAll();
  }

  async function toggleUser(id: number, isActive: boolean) {
    if (isActive) await api.patch(`/admin/users/${id}/disable`);
    else await api.patch(`/admin/users/${id}/enable`);
    loadAll();
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user permanently?')) return;
    await api.delete(`/admin/users/${id}`);
    loadAll();
  }

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Create User</h2>
          {uMsg && <div className={`alert ${uMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{uMsg}</div>}
          <form onSubmit={createUser}>
            <div className="form-group"><label>Name</label><input value={uName} onChange={(e) => setUName(e.target.value)} required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} required /></div>
            <div className="form-group"><label>Password</label><input type="password" value={uPass} onChange={(e) => setUPass(e.target.value)} required /></div>
            <div className="form-group">
              <label>Role</label>
              <select value={uRole} onChange={(e) => setURole(e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div className="form-group">
              <label>Location (staff only)</label>
              <select value={uBranch} onChange={(e) => setUBranch(e.target.value)}>
                <option value="">— None —</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Salary (optional)</label><input type="number" value={uSalary} onChange={(e) => setUSalary(e.target.value)} /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create User</button>
          </form>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Add Location</h2>
          {bMsg && <div className={`alert ${bMsg.includes('added') ? 'alert-success' : 'alert-error'}`}>{bMsg}</div>}
          <form onSubmit={addBranch}>
            <div className="form-group"><label>Location Name</label><input value={bName} onChange={(e) => setBName(e.target.value)} required /></div>
            <div className="form-group"><label>Address</label><input value={bAddress} onChange={(e) => setBAddress(e.target.value)} required /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Location</button>
          </form>
          <h3 style={{ marginTop: '1.5rem' }}>Existing Locations</h3>
          {branches.map((b) => (
            <div key={b.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{b.name}</div>
          ))}
        </div>
      </div>
      <h2 style={{ margin: '2rem 0 1rem' }}>All Users</h2>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: 4 }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td>{u.branch?.name ?? '—'}</td>
              <td><span className={`badge badge-${u.isActive ? 'confirmed' : 'cancelled'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
              <td style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleUser(u.id, u.isActive)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
