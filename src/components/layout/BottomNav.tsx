import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import { cx } from '../../utils/cx'

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 lg:hidden"
      aria-label="Primary navigation"
      style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cx(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.62rem] font-medium transition focus:outline-none focus-visible:shadow-focus',
                isActive ? 'bg-ink text-white' : 'text-gray-500 hover:bg-gray-100',
              )
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
