import { Banknote, BriefcaseBusiness, CalendarDays, CircleHelp, FileText, Home, Network, Rocket, SlidersHorizontal } from 'lucide-react'

export const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Projects', href: '/projects', icon: Rocket },
  { label: 'Pipeline', href: '/pipeline', icon: BriefcaseBusiness },
  { label: 'Network', href: '/network', icon: Network },
  { label: 'Docs', href: '/docs', icon: FileText },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Capital', href: '/capital', icon: Banknote },
  { label: 'Customize', href: '/customize', icon: SlidersHorizontal },
  { label: 'How it works', href: '/how-it-works', icon: CircleHelp },
]
