import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { QuickAdd } from './QuickAdd'

export function Shell() {
  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <div className="min-h-[100dvh] lg:grid lg:grid-cols-[350px_minmax(0,1fr)]">
        <Sidebar />
        <main className="min-h-[100dvh] bg-white px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto w-full max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <QuickAdd />
    </div>
  )
}
