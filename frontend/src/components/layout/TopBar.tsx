import { useLocation } from 'react-router-dom';
import { Bell, Menu, Moon, Sun, Activity } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export default function TopBar() {
  const location = useLocation();
  const { 
    toggleSidebar, 
    notificationCount, 
    pipelineStatus,
    darkMode,
    toggleDarkMode
  } = useAppStore();

  // Simple formatting for page title based on path
  const formatPathToTitle = (path: string) => {
    if (path === '/') return 'Home';
    const segment = path.split('/')[1];
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const title = formatPathToTitle(location.pathname);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Toggle sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        
        <div className={`ml-4 hidden sm:flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(pipelineStatus)}`}>
          <Activity className={`mr-1.5 h-3 w-3 ${pipelineStatus === 'running' ? 'animate-pulse' : ''}`} />
          Pipeline: {pipelineStatus.charAt(0).toUpperCase() + pipelineStatus.slice(1)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
        >
          <span className="sr-only">Toggle dark mode</span>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          type="button"
          className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
        
        <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white cursor-pointer hover:bg-indigo-700 transition-colors">
          JD
        </div>
      </div>
    </header>
  );
}
