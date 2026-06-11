import { useEffect, useState } from 'react';
import api from '../api/axios';

interface OrderItem { menuItem: { name: string }; quantity: number }
interface Order { id: number; status: string; createdAt: string; items: OrderItem[]; paid?: boolean; paidAt?: string }
interface MenuItem { id: number; name: string; category: string; price: number }

export default function ChefDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<{ name: string; description: string; price: string; category: string }>({ name: '', description: '', price: '', category: '' });

  useEffect(() => {
    api.get('/chef/orders').then((r) => setOrders(r.data));
    api.get('/chef/menu').then((r) => setMenu(r.data));
  }, []);

  async function markDone(id: number) {
    try {
      await api.patch(`/chef/orders/${id}/done`);
      setOrders((prev) => prev.filter((order) => order.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not mark order done.';
      alert(msg);
    }
  }

  async function deleteMenuItem(id: number) {
    if (!confirm('Delete this menu item?')) return;
    await api.delete(`/chef/menu/${id}`);
    setMenu((prev) => prev.filter((item) => item.id !== id));
  }

  async function addMenuItem() {
    if (!newItem.name || !newItem.category || !newItem.price) { alert('Name, category and price are required'); return; }
    const priceNum = Number(newItem.price);
    if (Number.isNaN(priceNum)) { alert('Price must be a number'); return; }
    try {
      const r = await api.post('/chef/menu', { name: newItem.name, description: newItem.description, price: priceNum, category: newItem.category });
      setMenu((prev) => [r.data, ...prev]);
      setNewItem({ name: '', description: '', price: '', category: '' });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Failed to add menu item');
    }
  }

  return (
    <div className="page">
      <h1>Chef Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Active Orders</div>
        </div>
      </div>

      <h2 style={{ margin: '2rem 0 1rem' }}>Orders in Kitchen</h2>
      {orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No active orders.</p>
      ) : (
        <div className="card-grid">
          {orders.map((o) => (
            <div className="card" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <h3>Order #{o.id}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
                  {o.paid ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <span className="badge badge-warning">Awaiting Payment</span>
                  )}
                </div>
              </div>
              <ul style={{ margin: '0.75rem 0', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                {o.items.map((item, index) => (
                  <li key={index}>{item.menuItem.name} × {item.quantity}</li>
                ))}
              </ul>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => markDone(o.id)}
                disabled={!o.paid}
                title={!o.paid ? 'Order must be paid by cashier before marking done' : undefined}
              >
                ✓ Mark Done
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ margin: '2rem 0 1rem' }}>Branch Menu</h2>
      <div className="card" style={{ marginBottom: 12, padding: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Add Menu Item</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
          <input placeholder="Price" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Description" style={{ flex: 1 }} value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          <button className="btn btn-primary" onClick={addMenuItem}>Add</button>
        </div>
      </div>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th></th></tr></thead>
        <tbody>
          {menu.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.category}</td>
              <td>${m.price.toFixed(2)}</td>
              <td><button className="btn btn-danger btn-sm" onClick={() => deleteMenuItem(m.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
