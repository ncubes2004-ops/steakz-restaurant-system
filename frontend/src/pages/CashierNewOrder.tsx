import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function CashierNewOrder() {
  const { user } = useAuth();
  const [tables, setTables] = useState<{ id: number; tableNumber: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !user.branchId) return;
    // only load tables for table assignment; menu selection has been removed
    (async () => {
      try {
        const res = await fetch(`/api/public/branches/${user.branchId}`);
        const data = await res.json();
        setTables(data.tables ?? []);
      } catch (err) {
        console.error('Failed to load tables', err);
        setTables([]);
      }
    })();
  }, [user]);

  return (
    <div className="page no-visual cashier-new-order">
      <h1>New Order (Menu selection disabled)</h1>
      <div style={{ maxWidth: 920, marginTop: 12 }}>
        <div className="card" style={{ background: 'rgba(12,12,12,0.98)' }}>
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 90 }}>TABLE (optional)</label>
            <select value={selectedTable ?? ''} onChange={(e) => setSelectedTable(e.target.value ? Number(e.target.value) : null)} style={{ padding: '0.45rem 0.6rem', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', minWidth: 180 }}>
              <option value="">-- No table --</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Table {t.tableNumber}</option>)}
            </select>
            <div style={{ marginLeft: 'auto' }}>
              <Link to="/cashier" className="btn btn-outline">Back to Dashboard</Link>
            </div>
          </div>

          <div style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>
            Menu item selection has been disabled for cashier users. To place menu orders, use the POS terminal or an admin interface that supports item entry. This page only allows table assignment for walk-ins.
          </div>

        </div>
      </div>
    </div>
  );
}
