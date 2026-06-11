import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="hero-subtitle">Meet, Eat, Enjoy</span>
          <h1>Meet, Eat, <span>Enjoy</span><br />The True Taste</h1>
          <p>Experience premium steakhouse dining with bold flavors, elegant ambiance, and unforgettable nights.</p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-danger">Book a Table</Link>
            <Link to="/menu" className="btn btn-outline">Order Online</Link>
          </div>
        </div>

        <div className="landing-visual">
            <div className="visual-card">
            <div className="visual-glow" />
            <div className="visual-plate" />
          </div>
        </div>
      </section>

      <section className="welcome-section">
          <div className="welcome-card">
          <div className="welcome-copy">
            <span className="section-tag">Hello & Welcome!</span>
            <h2>Discover the true taste of Steakz.</h2>
            <p>Our chefs craft every dish with premium ingredients, bold spices, and grilled mastery so every meal feels unforgettable.</p>
          </div>
          <div className="welcome-media" />
        </div>
      </section>
    </main>
  );
}
