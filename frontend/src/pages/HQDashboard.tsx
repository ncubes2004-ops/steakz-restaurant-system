import { useEffect, useState } from 'react';
import api from '../api/axios';

interface BranchOverview { id: number; name: string; _count?: { orders?: number; users?: number; tables?: number } }
interface SalesRow { branchId: number; branchName: string; totalSales: number; orderCount: number }
interface Staff { id: number; name: string; role: string; salary?: number; isActive: boolean; branch?: { name: string } }
interface OrderItem { menuItem: { name: string }; quantity: number }
interface Order { id: number; total: number; status: string; createdAt: string; branch: { name: string }; items: OrderItem[]; customer?: { name: string } }

export default function HQDashboard() {
  const [branches, setBranches] = useState<BranchOverview[]>([]);
  const [sales, setSales] = useState<SalesRow[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [b, s, st, o] = await Promise.all([
          api.get('/hq/overview'),
          api.get('/hq/sales'),
          api.get('/hq/staff'),
          api.get('/hq/orders'),
        ]);
        setBranches(b.data ?? []);
        setSales(s.data ?? []);
        setStaff(st.data ?? []);
        setOrders(o.data ?? []);
      } catch (err) {
        // ignore; UI will show empty states
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <h1>HQ Dashboard</h1>
      <p style={{ color: 'var(--text-muted)' }}>Overview for all branches and company-wide reports.</p>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Sales Summary</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading sales...</p>
        ) : (
          <div className="stat-grid">
            {sales.map((s) => (
              <div key={s.branchId} className="stat-box">
                <div className="stat-value">${s.totalSales.toFixed(2)}</div>
                <div className="stat-label">{s.branchName} — {s.orderCount} orders</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Branches</h2>
        {branches.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No branches found.</p>
        ) : (
          <div className="card-grid">
            {branches.map((b) => (
              <div key={b.id} className="card">
                <h3>{b.name}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Orders: {b._count?.orders ?? 0} · Staff: {b._count?.users ?? 0} · Tables: {b._count?.tables ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Staff</h2>
        {staff.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No staff records.</p>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Branch</th><th>Salary</th><th>Status</th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.role}</td>
                  <td>{s.branch?.name ?? '—'}</td>
                  <td>{s.salary ? `$${s.salary}` : '—'}</td>
                  <td><span className={`badge badge-${s.isActive ? 'confirmed' : 'cancelled'}`}>{s.isActive ? 'Active' : 'Disabled'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Recent Orders</h2>
        {orders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No recent orders.</p>
        ) : (
          <div className="card-grid">
            {orders.slice(0, 12).map((o) => (
              <div key={o.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Order #{o.id}</h3>
                  <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0' }}>{o.branch.name} — {new Date(o.createdAt).toLocaleString()}</p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                  {o.items.map((it, i) => <li key={i}>{it.menuItem.name} × {it.quantity}</li>)}
                </ul>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--gold)', fontWeight: 700 }}>${o.total.toFixed(2)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{o.customer?.name ?? 'Guest'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

