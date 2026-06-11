import { useEffect, useState } from 'react';
import api from '../api/axios';
import BranchStatsChart from '../components/BranchStatsChart';

interface SalesData { totalSales: number; orderCount: number }
interface Staff { id: number; name: string; role: string; salary?: number; isActive: boolean }
interface Order { id: number; total: number; status: string; createdAt: string; customer?: { name: string } }

export default function BranchManagerDashboard() {
  const [sales, setSales] = useState<SalesData | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get('/branch-manager/sales').then((r) => setSales(r.data));
    api.get('/branch-manager/staff').then((r) => setStaff(r.data));
    api.get('/branch-manager/orders').then((r) => setOrders(r.data));
  }, []);

  // prepare daily totals for the last 7 days from orders
  const dailyData = (() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();
      days[key] = 0;
    }
    for (const o of orders) {
      const key = new Date(o.createdAt).toLocaleDateString();
      if (key in days) days[key] += Number(o.total || 0);
    }
    return Object.keys(days).map((k) => ({ label: k.split('/').slice(0,2).join('/'), value: Math.round(days[k]) }));
  })();

  return (
    <div className="page">
      <h1>Branch Manager</h1>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">${sales?.totalSales.toFixed(2) ?? '—'}</div>
          <div className="stat-label">Total Sales</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{sales?.orderCount ?? '—'}</div>
          <div className="stat-label">Orders Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{staff.length}</div>
          <div className="stat-label">Staff Members</div>
        </div>
      </div>

      <h2 style={{ margin: '2rem 0 1rem' }}>Sales (last 7 days)</h2>
      <div className="card" style={{ padding: 12 }}>
        <BranchStatsChart data={dailyData} />
      </div>

      <h2 style={{ margin: '2rem 0 1rem' }}>Staff & Salaries</h2>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Role</th><th>Salary</th><th>Status</th></tr></thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.role}</td>
              <td>{s.salary ? `$${s.salary}` : '—'}</td>
              <td><span className={`badge badge-${s.isActive ? 'confirmed' : 'cancelled'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ margin: '2rem 0 1rem' }}>All Branch Orders</h2>
      <table className="data-table">
        <thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>#{o.id}</td>
              <td>{o.customer?.name ?? 'Walk-in'}</td>
              <td>${o.total.toFixed(2)}</td>
              <td><span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
