import {
  ClipboardList,
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
  /** i18n key under `st.nav.*` */
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
  /** show a live count badge sourced from dashboard state */
  liveKey?: 'verifying';
}

export interface NavGroup {
  /** i18n key under `st.nav.*`, or undefined for the ungrouped first row */
  labelKey?: string;
  items: NavItem[];
}

/**
 * Sidebar nav for the SupplierTrade console. Labels are i18n keys resolved with
 * t() in the layout, so the whole nav switches language instantly. Admin-only
 * items are gated by role.
 */
export const NAV: NavGroup[] = [
  {
    items: [
      { to: '/dashboard', labelKey: 'st.nav.dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    labelKey: 'st.nav.suppliers',
    items: [
      { to: '/suppliers', labelKey: 'st.nav.suppliers', icon: Store, liveKey: 'verifying' },
      { to: '/onboarding', labelKey: 'st.nav.onboard', icon: UserPlus },
      { to: '/rfqs', labelKey: 'st.nav2.rfqs', icon: ClipboardList },
    ],
  },
  {
    labelKey: 'st.nav.settings',
    items: [
      { to: '/config', labelKey: 'st.nav.config', icon: SlidersHorizontal, adminOnly: true },
      { to: '/referrals', labelKey: 'st.nav.referrals', icon: Gift },
      { to: '/settings', labelKey: 'st.nav.settings', icon: Settings },
    ],
  },
];
