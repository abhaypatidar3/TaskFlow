import './LandingPage.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, color: 'var(--success)' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const features = [
  { icon: '📋', title: 'Project Management', desc: 'Create and organize projects with ease. Assign members, track progress, and manage deadlines all in one place.' },
  { icon: '✅', title: 'Smart Task Tracking', desc: 'Full lifecycle task management with priorities, due dates, status updates, and real-time activity logs.' },
  { icon: '📊', title: 'Performance Analytics', desc: 'Visual dashboards showing team productivity, overdue tasks, work logs, and member performance heatmaps.' },
  { icon: '🔐', title: 'Role-Based Access', desc: 'Granular ADMIN and MEMBER roles ensure the right people have the right level of access at all times.' },
  { icon: '📝', title: 'Work Logs & Time Tracking', desc: 'Members log hours directly on tasks. Admins get aggregated reports and contribution heatmaps.' },
  { icon: '⚡', title: 'Real-Time Activity', desc: 'Every status change, comment, and update is logged automatically — full audit trail for every task.' },
];

const techStack = [
  { name: 'React 19', emoji: '⚛️' },
  { name: 'Vite', emoji: '⚡' },
  { name: 'Node.js', emoji: '🟢' },
  { name: 'Express', emoji: '🚀' },
  { name: 'MongoDB', emoji: '🍃' },
  { name: 'JWT Auth', emoji: '🔐' },
  { name: 'Recharts', emoji: '📊' },
  { name: 'Railway', emoji: '🚂' },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <a href="/" className="landing-nav-logo">
          <div className="logo-icon">⚡</div>
          <span>TaskFlow</span>
        </a>
        <div className="landing-nav-links">
          <a href="#features" className="landing-nav-link hide-mobile">Features</a>
          <a href="#about" className="landing-nav-link hide-mobile">About</a>
          {user ? (
            <Link to="/dashboard" className="landing-nav-cta">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="landing-nav-link">Login</Link>
              <Link to="/signup" className="landing-nav-cta">Get Started →</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="hero-bg-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot" />
            Built for modern teams
          </div>
          <h1 className="hero-title">
            Manage Tasks,<br />
            <span className="gradient-text">Ship Faster Together</span>
          </h1>
          <p className="hero-subtitle">
            TaskFlow is a full-featured team task manager with role-based access, time tracking,
            performance analytics, and real-time activity logs — everything your team needs to stay aligned.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="hero-btn-primary">
              Start for Free →
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            {[
              { value: '6+', label: 'Core Modules' },
              null,
              { value: 'RBAC', label: 'Role-Based Access' },
              null,
              { value: '100%', label: 'Full Stack' },
            ].map((item, i) =>
              item === null
                ? <div key={i} className="hero-stat-divider" />
                : (
                  <div key={i} className="hero-stat-item">
                    <div className="hero-stat-value">{item.value}</div>
                    <div className="hero-stat-label">{item.label}</div>
                  </div>
                )
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-section" id="features">
        <div className="section-header">
          <div className="section-tag">Features</div>
          <h2 className="section-title">Everything you need to <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>run your team</span></h2>
          <p className="section-subtitle">A complete project and task management platform built end-to-end with modern technologies.</p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <div className="landing-tech-section">
        <div className="tech-inner">
          <div className="tech-label">Built With</div>
          <div className="tech-pills">
            {techStack.map(t => (
              <div className="tech-pill" key={t.name}>
                <span>{t.emoji}</span> {t.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── About / Developer ── */}
      <section className="landing-about" id="about">
        <div className="about-inner">
          <div className="about-grid">
            {/* Left: About the project */}
            <div>
              <div className="section-tag">About This Project</div>
              <h2 className="about-project-title">
                A Full-Stack Task Manager, <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Built from Scratch</span>
              </h2>
              <p className="about-project-desc">
                TaskFlow was designed and developed as a comprehensive team task management system.
                It features a React frontend, a Node.js/Express REST API, and a MongoDB database —
                all deployed on Railway.
              </p>
              <p className="about-project-desc">
                The project covers the full spectrum of software development: authentication & authorization,
                role-based access control, time tracking, analytics, and a polished, responsive UI.
              </p>
              <div className="about-company-badge">
                <div>
                  <div className="company-logo-text">✨ ethara.ai</div>
                  <p>This project was built as a task assignment from ethara.ai — thank you for the opportunity!</p>
                </div>
              </div>
            </div>

            {/* Right: Developer card */}
            <div className="dev-card">
              <div className="dev-avatar-ring">AP</div>
              <div className="dev-card-body">
                <div className="dev-name">Abhay Patidar</div>
                <div className="dev-role">Full Stack Developer</div>
                <div className="dev-tagline">
                  Designed, architected & built this entire project end-to-end —<br />
                  from the database schema to the pixel-perfect UI.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                  {['React + Vite Frontend', 'Node.js / Express API', 'MongoDB + Mongoose ODM', 'JWT Auth + RBAC', 'Railway Deployment'].map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                      <CheckIcon />{s}
                    </div>
                  ))}
                </div>
                <div className="dev-links">
                  <a
                    href="https://github.com/abhaypatidar3"
                    target="_blank" rel="noreferrer"
                    className="dev-link"
                  >
                    <GitHubIcon /> GitHub
                  </a>
                  <a
                    href="https://www.linkedin.com/in/abhaypatidar-0827cs221010"
                    target="_blank" rel="noreferrer"
                    className="dev-link"
                  >
                    <LinkedInIcon /> LinkedIn
                  </a>
                </div>
                <div className="dev-built-tag">
                  Built for <span>ethara.ai</span> · 2024
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to get<br /><span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>started?</span></h2>
          <p className="cta-subtitle">Sign up in seconds. No credit card required. Start managing your team's tasks today.</p>
          <div className="hero-actions">
            <Link to="/signup" className="hero-btn-primary">Create Free Account →</Link>
            <Link to="/login" className="hero-btn-secondary">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <p>
          © 2024 TaskFlow · Built by{' '}
          <a href="https://github.com/abhaypatidar3" target="_blank" rel="noreferrer">Abhay Patidar</a>
          {' '}· Assignment for{' '}
          <a href="https://ethara.ai" target="_blank" rel="noreferrer">ethara.ai</a>
        </p>
      </footer>
    </div>
  );
}
