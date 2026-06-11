import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface MenuItem { id: number; name: string; price: number; category: string }
interface OrderItem { id: number; menuItem?: { id?: number; name?: string }; quantity: number; unitPrice: number }
interface OrderBooking { id: number; table?: { id: number; tableNumber: number } }
interface Order { id: number; total: number; status: string; createdAt: string; paid?: boolean; items?: OrderItem[]; booking?: OrderBooking }

export default function CashierDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<{ id: number; tableNumber: number }[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ id: number; qty: number }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [menuLoading, setMenuLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => { api.get('/cashier/orders').then((r) => setOrders(r.data)).catch(() => {}); }, []);

  // load bookings when user/branch is available
  useEffect(() => {
    if (user && user.branchId) loadBookings();
  }, [user]);

  // bookings removed for cashier UI

  useEffect(() => {
    // Use a hardcoded menu for cashier UI so it doesn't depend on fetching
    const HARD_CODED_MENU: MenuItem[] = [
      { id: 1, name: 'Ribeye Steak', price: 29.99, category: 'Steaks' },
      { id: 2, name: 'Caesar Salad', price: 9.5, category: 'Starters' },
      { id: 3, name: 'Grilled Asparagus', price: 8.25, category: 'Sides' },
      { id: 4, name: 'Garlic Butter Shrimp', price: 14.75, category: 'Starters' },
      { id: 5, name: 'Chocolate Lava Cake', price: 7.5, category: 'Desserts' },
      { id: 6, name: 'House Wine', price: 12.5, category: 'Drinks' },
    ];
    setMenu(HARD_CODED_MENU);
    // still load tables from branch when available
    if (user === null) return;
    if (user && user.branchId) loadMenuAndTables();
    else setMenuLoading(false);
  }, [user]);

  async function loadMenuAndTables() {
    setError('');
    setSuccess('');
    setMenuLoading(true);
    const branchId = user?.branchId;
    if (!branchId) { setMenu([]); setTables([]); setMenuLoading(false); return; }
    try {
      const [menuRes, branchRes] = await Promise.all([
        api.get(`/menu/${branchId}`),
        api.get(`/public/branches/${branchId}`),
      ]);
      const menuItems = menuRes.data?.length > 0 ? menuRes.data : (branchRes.data.menuItems ?? []);
      setMenu(menuItems);
      setTables(branchRes.data.tables ?? []);
      if (!menuItems || menuItems.length === 0) setError('No menu items found for your branch.');
    } catch (err) {
      console.error('Failed to load menu or branch data', err);
      setError('Failed to load menu for your branch.');
    } finally {
      setMenuLoading(false);
    }
  }

  function toggleItem(id: number) {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id === id);
      return exists ? prev.filter((p) => p.id !== id) : [...prev, { id, qty: 1 }];
    });
  }

  function setQty(id: number, qty: number) {
    setSelected((prev) => prev.map((p) => p.id === id ? { ...p, qty } : p));
  }

  async function submitOrder() {
    setError(''); setSuccess('');
    if (selected.length === 0) { setError('Add at least one item.'); return; }
    if (!user?.branchId) { setError('This account is not assigned to a branch.'); return; }
    try {
      // send items by name when ids may not align with backend seed
      const itemsPayload = selected.map((s) => {
        const mi = menu.find((m) => m.id === s.id);
        if (mi && typeof mi.id === 'number') return { menuItemId: mi.id, quantity: Number(s.qty) };
        return { name: mi?.name ?? '', quantity: Number(s.qty) };
      });
      // debug: log payload being sent
      console.log('Submitting order payload:', { items: itemsPayload });

      const postR = await api.post('/cashier/orders', { items: itemsPayload });
      console.log('Order POST response:', postR.data);
      const r = await api.get('/cashier/orders');
      setOrders(r.data);
      setSelected([]);
      setSuccess('Order created successfully.');
    } catch (err: any) {
      console.error('Failed to create order:', err);
      const serverMsg = err?.response?.data?.error ?? err?.response?.data ?? err?.message;
      setError(typeof serverMsg === 'string' ? serverMsg : 'Failed to create order.');
    }
  }

  async function markPaid(id: number) {
    try {
      await api.patch(`/cashier/orders/${id}/pay`);
      const r = await api.get('/cashier/orders');
      setOrders(r.data);
      setSuccess(`Order #${id} marked as paid.`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to mark paid.');
    }
  }

  async function markDelivered(id: number) {
    try {
      await api.patch(`/cashier/orders/${id}/deliver`);
      const r = await api.get('/cashier/orders');
      setOrders(r.data);
      setSuccess(`Order #${id} marked as delivered.`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to mark delivered.');
    }
  }

  async function loadBookings() {
    try {
      const r = await api.get('/cashier/bookings');
      // Hide cancelled bookings from the cashier view
      setBookings((r.data ?? []).filter((b: any) => b.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  }

  

  function printOrder(o: Order & any) {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;
    const tableNum = o.booking?.table?.tableNumber ?? 'N/A';
    const itemsHtml = o.items?.map((it: any) => `<tr><td>${it.menuItem?.name ?? ''}</td><td style="text-align:right">${it.quantity}</td><td style="text-align:right">$${it.unitPrice.toFixed(2)}</td></tr>`).join('');
    const html = `
      <html><head><title>Order #${o.id}</title></head><body>
        <h2>Order #${o.id}</h2>
        <div>Table: ${tableNum}</div>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">${itemsHtml}</table>
        <div style="margin-top:12px;font-weight:800">Total: $${o.total.toFixed(2)}</div>
      </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function confirmBooking(id: number) {
    setError(''); setSuccess('');
    try {
      await api.patch(`/cashier/bookings/${id}/confirm`);
      setSuccess('Booking confirmed.');
      await loadBookings();
      if (user?.branchId) await loadMenuAndTables();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to confirm booking.');
    }
  }

  async function cancelBooking(id: number) {
    setError(''); setSuccess('');
    try {
      await api.patch(`/cashier/bookings/${id}/cancel`);
      setSuccess('Booking cancelled. Table is now available.');
      await loadBookings();
      if (user?.branchId) await loadMenuAndTables();
    } catch (err: any) {
      console.error('Cancel booking error:', err);
      const serverMsg = err?.response?.data?.error ?? err?.response?.data ?? err?.message;
      setError(typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg));
    }
  }

  return (
    <div className="page no-visual">
      <h1>Cashier Dashboard</h1>
      <div style={{ marginTop: 20 }}>
        <div className="card" style={{ marginBottom: 18 }}>
          <h2 style={{ marginBottom: 12 }}>New Order</h2>
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={selectedTableId ?? ''} onChange={(e) => setSelectedTableId(e.target.value ? Number(e.target.value) : null)} style={{ padding: '6px 8px' }}>
                <option value="">No table</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.tableNumber}</option>
                ))}
              </select>
              <button className="btn btn-primary" onClick={submitOrder} disabled={menu.length === 0 || selected.length === 0 || !user?.branchId}>
                Place Order
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 8 }}>
            {menuLoading ? (
              <div style={{ color: 'var(--text-muted)' }}>Loading menu…</div>
            ) : !menu || menu.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>
                No menu items available for your branch.
              </div>
            ) : (
              menu.map((m) => {
                const selectedItem = selected.find((s) => s.id === m.id);
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                    <input type="checkbox" checked={!!selectedItem} onChange={() => toggleItem(m.id)} />

                    <div style={{ marginLeft: 8, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="cashier-item-name" style={{ fontWeight: 700 }}>{m.name}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{m.category}</span>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 12 }}>
                          <div style={{ color: 'var(--gold)', fontWeight: 800 }}>${Number(m.price).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {selectedItem && (
                      <input
                        type="number"
                        min={1}
                        value={selectedItem.qty}
                        onChange={(e) => setQty(m.id, Math.max(1, parseInt(e.target.value || '1', 10)))}
                        style={{ width: 64 }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <h2 style={{ marginBottom: 12 }}>Recent Orders</h2>
        {/* Reservations: pending bookings for this branch */}
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ marginBottom: 8 }}>Reservations</h3>
          {bookings.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No reservations.</div>
          ) : (
            bookings.slice(0, 8).map((b: any) => (
              <div key={b.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.customer?.name ?? 'Guest'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Table {b.table?.tableNumber ?? 'TBD'} — {new Date(b.date).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>
                      {b.status === 'CONFIRMED' ? <span className="badge-delivered" style={{ padding: '6px 10px' }}>Reserved</span> : <span className="badge-pending" style={{ padding: '6px 10px' }}>{b.status}</span>}
                    </div>
                    {b.status === 'PENDING' && (
                      <button className="btn btn-primary btn-sm" onClick={() => confirmBooking(b.id)}>Confirm</button>
                    )}
                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => cancelBooking(b.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.slice(0, 12).map((o) => (
            <div className="card" key={o.id} style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                      <div style={{ fontWeight: 800 }}>
                        Order #{o.id}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--gold)', fontWeight: 800 }}>${o.total.toFixed(2)}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div className={o.status === 'DONE' ? 'badge-preparing' : o.status === 'PREPARING' ? 'badge-preparing' : o.status === 'DELIVERED' ? 'badge-delivered' : 'badge-pending'} style={{ padding: '6px 10px' }}>{o.status}</div>
                    {!o.paid && <button className="btn btn-primary btn-sm" onClick={() => markPaid(o.id)}>Mark Paid</button>}
                    {o.paid && o.status !== 'DELIVERED' && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => printOrder(o)}>Print</button>
                        <button className="btn btn-outline btn-sm" onClick={() => markDelivered(o.id)}>Served</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
