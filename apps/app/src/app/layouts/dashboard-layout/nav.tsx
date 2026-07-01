import {
  Gift,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Store,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
  /** show a live count badge sourced from dashboard state */
  liveKey?: 'verifying';
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Sidebar nav for the SupplierTrade console. Grouped with uppercase eyebrows —
 * every item points at a real route. Admin-only items are gated by role.
 */
export const NAV: NavGroup[] = [
  {
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Supply',
    items: [
      { to: '/suppliers', label: 'Suppliers', icon: Store, liveKey: 'verifying' },
      { to: '/onboarding', label: 'Onboard supplier', icon: UserPlus },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/config', label: 'Configuration', icon: SlidersHorizontal, adminOnly: true },
      { to: '/referrals', label: 'Referrals', icon: Gift },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
