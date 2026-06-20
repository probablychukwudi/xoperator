import { NavLink } from 'react-router-dom'
import { Bookmark, ChevronRight, Folder, Mic, Plus, Search } from 'lucide-react'
import { navItems } from './navItems'
import { useAppStore } from '../../store/useAppStore'
import { cx } from '../../utils/cx'

export function Sidebar() {
  const savedViews = useAppStore((state) => state.savedViews)

  return (
    <aside className="hidden min-h-[100dvh] bg-[#f7f7f7] px-3 py-5 lg:flex lg:flex-col">
      <div className="mb-5 flex items-center gap-2 px-2 pt-0">
        <img src="/xoperator_logo_mark.svg" alt="" className="h-6 w-6 rounded-md" />
        <div className="text-lg font-semibold leading-none tracking-tight text-ink">xoperator</div>
      </div>
      <label className="mb-4 flex h-11 items-center gap-2 rounded-xl bg-[#ededed] px-3 text-sm text-gray-500">
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
          placeholder="Search"
          type="search"
        />
        <Mic size={16} aria-hidden="true" />
      </label>
      <nav className="space-y-1" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cx(
                  'flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus:outline-none focus-visible:shadow-focus',
                  isActive
                    ? 'border border-line bg-white text-ink shadow-[0_1px_6px_rgb(0_0_0/0.06)]'
                    : 'text-gray-500 hover:bg-white/70 hover:text-ink',
                )
              }
            >
              <Icon size={17} aria-hidden="true" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-8 space-y-1">
        <div className="flex h-9 items-center justify-between px-3 text-sm font-medium text-gray-400">
          <span className="inline-flex items-center gap-2">
            <ChevronRight size={14} aria-hidden="true" />
            File
          </span>
          <Plus size={15} aria-hidden="true" />
        </div>
        {['Builds', 'Company', 'People'].map((label) => (
          <div key={label} className="flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-500">
            <Folder size={17} aria-hidden="true" />
            {label}
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-1">
        <div className="flex h-9 items-center justify-between px-3 text-sm font-medium text-gray-400">
          <span className="inline-flex items-center gap-2">
            <ChevronRight size={14} aria-hidden="true" />
            Apps
          </span>
          <Plus size={15} aria-hidden="true" />
        </div>
        {savedViews.slice(0, 5).map((view) => (
          <NavLink
            key={view.id}
            to={view.href}
            className="flex h-9 items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-500 hover:bg-white/70 hover:text-ink"
          >
            <Bookmark size={17} aria-hidden="true" />
            <span className="truncate">{view.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
