import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  ShieldCheck, 
  Database, 
  GitBranch, 
  Users, 
  LifeBuoy, 
  Target, 
  Bot, 
  Megaphone, 
  Route, 
  FlaskConical, 
  CalendarDays, 
  TrendingUp, 
  BarChart3, 
  FileDown,
  BrainCircuit
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Data Upload', href: '/upload', icon: Upload },
  { name: 'Data Quality', href: '/quality', icon: ShieldCheck },
  { name: 'Feature Store', href: '/features', icon: Database },
  { name: 'Segmentation', href: '/segmentation', icon: GitBranch },
  { name: 'Segment Explorer', href: '/segments', icon: Users },
  { name: 'Rescue Queue', href: '/rescue', icon: LifeBuoy },
  { name: 'Marketing Actions', href: '/marketing', icon: Target },
  { name: 'AI Copilot', href: '/copilot', icon: Bot },
  { name: 'Campaign Gen', href: '/campaign', icon: Megaphone },
  { name: 'Behavior Journey', href: '/journey', icon: Route },
  { name: 'What-If Simulator', href: '/simulator', icon: FlaskConical },
  { name: 'Cohort Analysis', href: '/cohorts', icon: CalendarDays },
  { name: 'Revenue Intel', href: '/revenue', icon: TrendingUp },
  { name: 'Model Evaluation', href: '/model', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileDown },
];

export default function Sidebar() {
  const { sidebarOpen } = useAppStore();

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-gray-200 px-4">
        <BrainCircuit className="h-8 w-8 text-indigo-600 shrink-0" />
        {sidebarOpen && (
          <span className="ml-3 text-xl font-bold text-gray-900 whitespace-nowrap">
            BehaviorIQ
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4 custom-scrollbar">
        <nav className="flex-1 space-y-1">
          {navigation.map((item, index) => {
            const Icon = item.icon;
            
            // Add dividers after specific items
            const showDivider = ['/features', '/marketing', '/simulator'].includes(item.href);

            return (
              <React.Fragment key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon 
                    className={`h-5 w-5 shrink-0 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}
                    aria-hidden="true" 
                  />
                  {sidebarOpen && <span>{item.name}</span>}
                </NavLink>
                {showDivider && (
                  <div className="my-2 border-t border-gray-100" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
