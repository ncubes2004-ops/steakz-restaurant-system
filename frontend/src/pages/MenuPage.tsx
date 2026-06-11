import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface Branch { id: number; name: string; address: string; }
interface MenuItem { id: number; name: string; description?: string; price: number; category: string; }

export default function MenuPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/branches').then((r) => setBranches(r.data));
  }, []);

  async function loadMenu(branchId: number) {
    setSelectedId(branchId);
    setLoading(true);
    const r = await api.get(`/menu/${branchId}`);
    setMenu(r.data);
    setLoading(false);
  }

  const categories = [...new Set(menu.map((m) => m.category))];

  return (
    <div className="page steak-page">
      <div className="page-header">
        <div>
          <span className="section-tag">Our Menu</span>
          <h1>Discover Premium Cuts</h1>
          <p className="section-description">Select a branch and explore curated steakhouse favorites and elegant accompaniments.</p>
        </div>
      </div>

      <section className="branch-section">
        <div className="section-intro">
          <span className="section-tag">Locations</span>
          <h2>Choose the nearest Steakz branch</h2>
          <p className="section-description">Each branch offers a distinct menu, local atmosphere, and premium dining experience.</p>
        </div>
        <div className="branch-grid">
          {branches.map((branch) => (
            <article key={branch.id} className={`branch-card ${selectedId === branch.id ? 'branch-selected' : ''}`} onClick={() => loadMenu(branch.id)}>
              <div className="branch-card-top" />
              <h3>{branch.name}</h3>
              <p>{branch.address}</p>
              <span className="branch-cta">View menu</span>
            </article>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="feature-hero">
          <div className="wine-badge">Wine Pairing</div>
          <div>
            <span className="section-tag">Featured</span>
            <h2>Signature Steak & Wine Experience</h2>
            <p className="section-description">Hand-selected cuts paired with premium wine, served in an atmosphere of opulence.</p>
          </div>
        </div>
      </section>
      {error && <div className="alert alert-error" style={{ margin: '1rem 0' }}>{error}</div>}

      <section className="menu-section">
        {loading && <p className="section-description">Loading menu...</p>}

        {categories.length > 0 ? categories.map((cat) => (
          <div key={cat} className="category-block">
            <div className="category-header">
              <h3>{cat}</h3>
              <span className="category-label">Chef's Favorites</span>
            </div>
            <div className="card-grid">
              {menu.filter((m) => m.category === cat).map((item) => (
                <div className="card steak-card" key={item.id}>
                  <div className="steak-card-badge">{cat}</div>
                  <h3>{item.name}</h3>
                  {item.description && <p className="card-text">{item.description}</p>}
                  <div className="card-footer">
                    <span className="price">${item.price.toFixed(2)}</span>
                    <button
                      className="btn btn-outline"
                      onClick={async () => {
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        setError('');
                        try {
                          await api.post('/customer/orders', { items: [{ menuItemId: item.id, quantity: 1 }] });
                          navigate('/customer');
                        } catch (err: any) {
                          const serverMessage = err.response?.data?.error || 'Unable to place the order.';
                          setError(serverMessage);
                        }
                      }}
                    >
                      Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : selectedId && !loading ? (
          <p className="section-description">No menu items for this location yet.</p>
        ) : null}
      </section>
    </div>
  );
}
