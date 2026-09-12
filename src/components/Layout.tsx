import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookMarked, BookOpen, CalendarDays, CalendarRange, FileText, Printer, Settings, Sparkles } from 'lucide-react';
import { SyncStatusBadge } from './SyncStatusBadge';
import { toDateKey } from '../lib/dates';

const navItems = [
  { to: '/journal/jour', icon: CalendarDays, label: 'Jour' },
  { to: '/journal/semaine', icon: CalendarRange, label: 'Semaine' },
  { to: '/sequences', icon: BookMarked, label: 'Séquences' },
  { to: '/fiches', icon: FileText, label: 'Fiches de prep' },
  { to: '/rituels', icon: Sparkles, label: 'Rituels' },
  { to: '/impressions', icon: Printer, label: 'Impressions' },
  { to: '/reglages', icon: Settings, label: 'Réglages' },
];

export function Layout() {
  const navigate = useNavigate();
  const today = toDateKey(new Date());

  function resolveTo(to: string): string {
    if (to === '/journal/jour' || to === '/journal/semaine' || to === '/impressions') {
      return `${to}/${today}`;
    }
    return to;
  }

  return (
    <div className="min-h-screen flex bg-cream-50">
      <aside className="no-print w-56 shrink-0 border-r border-ink-500/10 bg-white flex flex-col">
        <button
          onClick={() => navigate(`/journal/jour/${today}`)}
          className="flex items-center gap-2.5 px-5 py-5 text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-white shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="font-semibold text-ink-900 leading-tight text-sm">Cahier Journal</p>
            <p className="text-xs text-ink-500 leading-tight">CE1</p>
          </div>
        </button>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={resolveTo(to)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-700 hover:bg-ink-500/5'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-ink-500/10">
          <SyncStatusBadge />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
