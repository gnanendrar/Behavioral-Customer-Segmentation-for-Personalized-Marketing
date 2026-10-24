import {
  LayoutDashboard, Upload, ShieldCheck, Database, GitBranch, Users, LifeBuoy, Target,
  Bot, Megaphone, Route, FlaskConical, CalendarDays, TrendingUp, BarChart3, FileDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  /** What the page is for, in plain words (shown in the command palette). */
  hint: string;
  /** Extra words people might search for. */
  keywords?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Grouped in the order the work happens: prepare data, find segments, act on them, measure. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, hint: 'Customers, revenue and segments at a glance', keywords: 'home overview kpi summary alerts' }],
  },
  {
    label: 'Prepare',
    items: [
      { name: 'Data upload', href: '/upload', icon: Upload, hint: 'Load a CSV or Excel file of customers', keywords: 'import csv excel file data' },
      { name: 'Data quality', href: '/quality', icon: ShieldCheck, hint: 'Missing values, types and completeness', keywords: 'missing values clean checks completeness' },
      { name: 'Feature store', href: '/features', icon: Database, hint: 'The 31 behaviour features and their spread', keywords: 'rfm variables columns engineering' },
    ],
  },
  {
    label: 'Segment',
    items: [
      { name: 'Segmentation', href: '/segmentation', icon: GitBranch, hint: 'Chosen model and how the algorithms compare', keywords: 'clusters kmeans pca model algorithm' },
      { name: 'Segment explorer', href: '/segments', icon: Users, hint: 'Who is in each segment and what defines them', keywords: 'clusters groups profiles personas' },
      { name: 'Behaviour journey', href: '/journey', icon: Route, hint: 'How customers move between segments', keywords: 'transitions movement upgrade downgrade' },
      { name: 'Cohorts', href: '/cohorts', icon: CalendarDays, hint: 'Segments by signup quarter', keywords: 'signup quarter retention' },
    ],
  },
  {
    label: 'Act',
    items: [
      { name: 'Rescue queue', href: '/rescue', icon: LifeBuoy, hint: 'Valuable customers most likely to leave', keywords: 'churn risk at-risk retention save leaving' },
      { name: 'Marketing actions', href: '/marketing', icon: Target, hint: 'Strategy, channel and offer per segment', keywords: 'strategy channel offer plan recommendations' },
      { name: 'Campaigns', href: '/campaign', icon: Megaphone, hint: 'Write email, SMS and push copy for a segment', keywords: 'email sms push copy write' },
      { name: 'What-if simulator', href: '/simulator', icon: FlaskConical, hint: 'Estimate the effect of an offer', keywords: 'what if discount estimate impact scenario' },
      { name: 'AI copilot', href: '/copilot', icon: Bot, hint: 'Ask questions about your segments', keywords: 'ai chat ask question assistant' },
    ],
  },
  {
    label: 'Measure',
    items: [
      { name: 'Revenue', href: '/revenue', icon: TrendingUp, hint: 'Revenue by segment and 90-day projection', keywords: 'forecast money sales projection' },
      { name: 'Model evaluation', href: '/model', icon: BarChart3, hint: 'Quality scores of every clustering run', keywords: 'evaluation silhouette metrics quality' },
      { name: 'Reports', href: '/reports', icon: FileDown, hint: 'Download CSV exports and the PDF report', keywords: 'export download pdf csv' },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const titleForPath = (path: string) => {
  if (path.startsWith('/customer/')) return 'Customer profile';
  return NAV_ITEMS.find((i) => i.href === path)?.name ?? 'BehaviorIQ';
};
