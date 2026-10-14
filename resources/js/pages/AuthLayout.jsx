import { CheckIcon, FlagIcon, TrendingUpIcon, UsersIcon } from '../components/icons';

const FEATURES = [
  { Icon: FlagIcon, title: 'Know what matters', text: 'Priorities and due dates show what needs you first.' },
  { Icon: TrendingUpIcon, title: 'See your progress', text: 'Move work from to do, to in progress, to done.' },
  { Icon: UsersIcon, title: 'Built for teams', text: 'Admins see the whole board and every change made to it.' },
];

function Brand({ light }) {
  return (
    <div className={`brand${light ? ' brand--light' : ''}`}>
      <span className="brand__mark" aria-hidden="true">
        <CheckIcon size={16} strokeWidth={3} />
      </span>
      <span className="brand__name">Tasks</span>
    </div>
  );
}

/** Shared frame for the login and sign-up screens. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__aside">
        <Brand light />

        <div className="auth__pitch">
          <h2>A calm place for everything on your plate.</h2>
          <p>Write it down, pick what matters, get it done. That's the whole idea.</p>

          <ul className="auth__features">
            {FEATURES.map(({ Icon, title: featureTitle, text }) => (
              <li key={featureTitle}>
                <span className="auth__feature-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{featureTitle}</strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="auth__quote">“The secret of getting ahead is getting started.”</p>
      </aside>

      <section className="auth__panel">
        <div className="auth__card">
          <div className="auth__mobile-brand">
            <Brand />
          </div>
          <h1>{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
          <p className="auth__footer">{footer}</p>
        </div>
      </section>
    </div>
  );
}
