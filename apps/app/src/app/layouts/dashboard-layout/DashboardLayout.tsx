import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  logoutThunk,
  selectUser,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { LanguageSwitcher, UserAvatar } from '@org/ui';
import { LogOut, Menu, PanelLeftClose, Plus, X } from 'lucide-react';
import { NAV } from './nav';

/**
 * The SupplierTrade console shell: a fixed, icon-led sidebar with grouped
 * sections + a light content canvas. Reused for the whole authenticated app
 * (admin + user flows). Landing pages live in the Next.js `web` app.
 */
export function DashboardLayout() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 px-4 backdrop-blur">
        <Brand />
        <button
          type="button"
          aria-label="Open menu"
          className="rounded-md p-2 text-foreground/70 hover:bg-secondary/50"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Sidebar (desktop fixed, mobile overlay) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border/60 bg-card transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          role={user?.role}
          onNavigate={() => setMobileOpen(false)}
          onClose={() => setMobileOpen(false)}
          user={user}
          onLogout={onLogout}
        />
      </aside>

      {/* Content */}
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-[1400px] px-5 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground">
        S
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        SupplierTrade
      </span>
    </Link>
  );
}

function Sidebar({
  role,
  onNavigate,
  onClose,
  user,
  onLogout,
}: {
  role?: string;
  onNavigate: () => void;
  onClose: () => void;
  user: ReturnType<typeof selectUser>;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4">
        <Brand />
        <button
          type="button"
          aria-label="Close menu"
          className="rounded-md p-1.5 text-foreground/50 hover:bg-secondary/50 lg:hidden"
          onClick={onClose}
        >
          <X size={16} />
        </button>
        <PanelLeftClose
          size={16}
          className="hidden text-foreground/30 lg:block"
        />
      </div>

      {/* Primary action */}
      <div className="px-3 pb-2">
        <NavLink
          to="/onboarding"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus size={16} />
          New supplier
        </NavLink>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV.map((group, gi) => {
          const items = group.items.filter(
            (i) => !i.adminOnly || role === 'admin',
          );
          if (!items.length) return null;
          return (
            <div key={gi} className="mb-4">
              {group.label && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-secondary/70 font-medium text-foreground'
                            : 'text-foreground/65 hover:bg-secondary/40 hover:text-foreground'
                        }`
                      }
                    >
                      <Icon size={17} strokeWidth={1.9} className="shrink-0" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border/60 p-3">
        <div className="mb-2.5">
          <LanguageSwitcher className="w-full" />
        </div>
        <div className="flex items-center gap-2.5">
          <UserAvatar name={user?.name} src={user?.picture} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-foreground/50">{user?.email}</p>
          </div>
          <button
            type="button"
            aria-label="Log out"
            onClick={onLogout}
            className="rounded-md p-1.5 text-foreground/50 hover:bg-error/10 hover:text-error"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

export default DashboardLayout;
