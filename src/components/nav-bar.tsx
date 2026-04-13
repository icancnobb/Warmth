'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/journal', label: 'Journal' },
  { href: '/chat', label: 'Chat' },
  { href: '/draw', label: 'Draw' },
  { href: '/profile', label: 'Profile' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="nav-bar" aria-label="Primary">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const className = isActive ? 'nav-link nav-link-active' : 'nav-link'

        return (
          <Link key={item.href} href={item.href} className={className}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
