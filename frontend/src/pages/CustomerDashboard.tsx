import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Booking {
  id: number;
  date: string;
  status: string;
  guestCount: number;
  table: { tableNumber: number; branch: { name: string } };
}
interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  branch: { name: string };
  items: { menuItem: { name: string }; quantity: number }[];
  paid?: boolean;
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    api.get('/customer/bookings').then((r) => setBookings(r.data));
    api.get('/customer/orders').then((r) => setOrders(r.data));
    if ((location.state as { message?: string } | null)?.message) {
      setFlash((location.state as { message?: string }).message || '');
    }
  }, [location.state]);

  async function cancelBooking(id: number) {
    await api.delete(`/customer/bookings/${id}`);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b)));
  }

  return (
    <div className="page">
      <h1>My Dashboard</h1>
      <p style={{ color: 'var(--text-muted)' }}>Welcome, {user?.name}</p>
      {flash && <div className="alert alert-success" style={{ margin: '1rem 0' }}>{flash}</div>}

      <h2 style={{ margin: '2rem 0 1rem' }}>My Reservations</h2>
      {bookings.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No reservations yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Table</th>
              <th>Guests</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.table.branch.name}</td>
                <td>Table {b.table.tableNumber}</td>
                <td>{b.guestCount}</td>
                <td>{new Date(b.date).toLocaleString()}</td>
                <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                <td>
                  {b.status === 'PENDING' && (
                    <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ margin: '2rem 0 1rem' }}>My Orders</h2>
      {orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
      ) : (
        <div className="card-grid">
          {orders.map((o) => (
            <div className="card" key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <h3>Order #{o.id}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className={`badge badge-${o.status.toLowerCase()}`}>{o.status}</span>
                  {o.paid && (
                    <span className="badge" style={{ background: 'rgba(196,30,58,0.12)', color: 'var(--accent-bright)', fontWeight: 700 }}>
                      Paid
                    </span>
                  )}
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.4rem 0' }}>
                {o.branch.name} — {new Date(o.createdAt).toLocaleDateString()}
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {o.items.map((item, index) => (
                  <li key={index}>{item.menuItem.name} × {item.quantity}</li>
                ))}
              </ul>
              <p style={{ color: 'var(--gold)', fontFamily: 'Playfair Display', fontWeight: 700, marginTop: '0.5rem' }}>
                ${o.total.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
