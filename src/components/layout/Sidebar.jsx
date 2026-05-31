import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Brain, StickyNote, Search, Tag, Network,
  MessageSquare, LogOut
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',        icon: StickyNote,     label: 'Notes'       },
  { to: '/search',           icon: Search,         label: 'Search'      },
  { to: '/tags',             icon: Tag,            label: 'Tags'        },
  { to: '/graph',            icon: Network,        label: 'Graph'       },
  { to: '/chat',             icon: MessageSquare,  label: 'AI Chat'     },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col glass border-r border-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
          <Brain size={16} className="text-accent" />
        </div>
        <div>
          <p className="font-display font-semibold text-ink-primary text-sm leading-none">Second Brain</p>
          <p className="text-ink-muted text-xs mt-0.5 font-mono">v0.1</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-medium transition-all duration-200 group
              ${isActive
                ? 'bg-accent/15 text-accent border border-accent/25 shadow-glow-sm'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-panel border border-transparent'}`
            }
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}


      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-panel border border-border">
          <div className="w-7 h-7 rounded-full bg-accent/30 border border-accent/40 flex items-center justify-center shrink-0">
            <span className="text-xs font-display font-semibold text-accent uppercase">
              {user?.username?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-medium text-ink-primary truncate">{user?.username}</p>
            <p className="text-xs text-ink-muted truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-ink-muted hover:text-red-400 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
