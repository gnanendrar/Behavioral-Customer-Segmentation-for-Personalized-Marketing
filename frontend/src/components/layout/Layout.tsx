import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import { useAppStore } from '../../stores/appStore';

export default function Layout() {
  const { sidebarOpen } = useAppStore();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Start each page at the top, and honour #anchors such as /dashboard#alerts.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (id) {
      const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
      return () => clearTimeout(t);
    }
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${sidebarOpen ? 'lg:pl-[248px]' : 'lg:pl-[72px]'}`}>
        <TopBar />
        <main id="main" ref={mainRef} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
