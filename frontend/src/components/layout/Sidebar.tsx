import { NavLink, Link } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { NAV_GROUPS } from '../../lib/navigation';
import { LogoMark, Wordmark } from '../common/Logo';

function NavContent({ compact, onNavigate }: { compact: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-2" aria-label="Main">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mt-4 first:mt-0">
          {!compact && (
            <p className="px-3 pb-1.5 text-[12px] font-medium text-gray-500">{group.label}</p>
          )}
          {compact && <div className="mx-3 mb-2 border-t border-gray-200 first:hidden" />}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onNavigate}
                    title={compact ? item.name : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-lg px-3 py-[7px] text-[14px] transition-colors ${
                        isActive
                          ? 'bg-white text-gray-900 font-semibold shadow-sm ring-1 ring-gray-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      } ${compact ? 'justify-center px-0' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !compact && (
                          <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-indigo-600" />
                        )}
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        {!compact && <span className="truncate">{item.name}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useAppStore();
  const compact = !sidebarOpen;

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-gray-200 bg-gray-50 transition-[width] duration-200 lg:flex ${
          compact ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        <div className={`flex h-16 shrink-0 items-center ${compact ? 'justify-center' : 'justify-between px-5'}`}>
          <Link to="/" className="flex items-center gap-2.5" aria-label="BehaviorIQ home">
            <LogoMark />
            {!compact && <Wordmark />}
          </Link>
          {!compact && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          )}
        </div>
        <NavContent compact={compact} />
        {compact && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="mx-auto mb-4 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </button>
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-gray-950/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col border-r border-gray-200 bg-gray-50 shadow-lg">
            <div className="flex h-16 items-center justify-between px-5">
              <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileNavOpen(false)}>
                <LogoMark />
                <Wordmark />
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent compact={false} onNavigate={() => setMobileNavOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
