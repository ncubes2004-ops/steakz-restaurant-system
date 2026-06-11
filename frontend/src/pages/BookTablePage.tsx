import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Branch { id: number; name: string; }
interface Table { id: number; tableNumber: number; capacity: number; }

export default function BookTablePage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [date, setDate] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/branches').then((r) => setBranches(r.data));
  }, []);

  async function onBranchChange(id: string) {
    setBranchId(id);
    setTables([]);
    if (id) {
      const r = await api.get(`/public/branches/${id}`);
      setTables(r.data.tables ?? []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/customer/bookings', {
        tableId: parseInt(tableId, 10),
        guestCount: parseInt(guestCount, 10),
        date,
      });
      setSuccess('Table reserved! Check your dashboard for details.');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Booking failed.');
    }
  }

  return (
    <div className="page steak-page">
      <div className="page-header">
        <div>
          <span className="section-tag">Reserve</span>
          <h1>Book Your Table</h1>
          <p className="section-description">Secure your evening at our premium steakhouse with an elegant reservation.</p>
        </div>
      </div>
      <div className="auth-box" style={{ maxWidth: 520 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Location</label>
            <select value={branchId} onChange={(e) => onBranchChange(e.target.value)} required>
              <option value="">Select a location</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Table</label>
            <select value={tableId} onChange={(e) => setTableId(e.target.value)} required>
              <option value="">Select a table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>Table {t.tableNumber} (seats {t.capacity})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Number of Guests</label>
            <input type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Date & Time</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Reservation</button>
        </form>
      </div>
    </div>
  );
}
