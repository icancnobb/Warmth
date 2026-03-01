'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: '日历', icon: '📅' },
  { href: '/chat', label: 'AI聊天', icon: '💬' },
  { href: '/draw', label: '绘画板', icon: '🎨' },
  { href: '/profile', label: '资料', icon: '👤' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex justify-around py-2">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'text-pink-500 bg-pink-50'
                : 'text-gray-600 hover:text-pink-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
