import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft, Moon, Sun, UserSearch } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { NAV_GROUPS } from '../../lib/navigation';

type Entry = {
  id: string;
  label: string;
  hint: string;
  keywords?: string;
  group: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  run: () => void;
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const { commandOpen, setCommandOpen, darkMode, toggleDarkMode } = useAppStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Global shortcut: Ctrl/⌘ + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(!useAppStore.getState().commandOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCommandOpen]);

  // Fresh search each time the palette opens.
  const [openedAt, setOpenedAt] = useState(0);
  if (commandOpen && openedAt === 0) { setOpenedAt(1); setQuery(''); setActive(0); }
  if (!commandOpen && openedAt !== 0) setOpenedAt(0);
  useEffect(() => {
    if (commandOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [commandOpen]);

  const close = () => setCommandOpen(false);

  const entries: Entry[] = useMemo(() => {
    const pages: Entry[] = NAV_GROUPS.flatMap((g) =>
      g.items.map((i) => ({
        id: i.href, label: i.name, hint: i.hint, keywords: i.keywords, group: g.label, icon: i.icon,
        run: () => navigate(i.href),
      })),
    );
    const q = query.trim();
    const customerLookup: Entry[] = /^cust-?\d+$/i.test(q)
      ? [{
          id: 'customer', label: `Open customer ${q.toUpperCase()}`, hint: 'Customer profile', group: 'Customers', icon: UserSearch,
          run: () => navigate(`/customer/${q.toUpperCase().replace(/^CUST(\d)/, 'CUST-$1')}`),
        }]
      : [];
    const actions: Entry[] = [{
      id: 'theme', label: darkMode ? 'Switch to light theme' : 'Switch to dark theme', hint: 'Appearance', group: 'Settings',
      icon: darkMode ? Sun : Moon, run: toggleDarkMode,
    }];
    return [...customerLookup, ...pages, ...actions];
  }, [navigate, darkMode, toggleDarkMode, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.id === 'customer' || `${e.label} ${e.hint} ${e.keywords ?? ''} ${e.group}`.toLowerCase().includes(q));
  }, [entries, query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const choose = (e?: Entry) => {
    if (!e) return;
    close();
    e.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(filtered[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {commandOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Go to page">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-gray-950/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={close}
          />
          <motion.div
            className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-gray-200 px-4">
              <Search className="h-[18px] w-[18px] text-gray-400" strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                placeholder="Search pages, or type a customer ID like CUST-00042"
                className="h-14 w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-list"
                aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
              />
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500">Esc</kbd>
            </div>
            <ul id="command-list" ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-8 text-center text-[14px] text-gray-500">No page matches “{query}”.</li>
              )}
              {filtered.map((e, i) => {
                const showGroup = e.group !== lastGroup;
                lastGroup = e.group;
                const Icon = e.icon;
                return (
                  <li key={e.id} role="presentation">
                    {showGroup && <p className="px-3 pb-1 pt-3 text-[12px] font-medium text-gray-500 first:pt-1">{e.group}</p>}
                    <button
                      type="button"
                      id={`cmd-${e.id}`}
                      role="option"
                      aria-selected={i === active}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(e)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${i === active ? 'bg-gray-100' : ''}`}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${i === active ? 'text-indigo-600' : 'text-gray-400'}`} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-medium text-gray-900">{e.label}</span>
                        <span className="block truncate text-[13px] text-gray-500">{e.hint}</span>
                      </span>
                      {i === active && <CornerDownLeft className="h-4 w-4 text-gray-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
