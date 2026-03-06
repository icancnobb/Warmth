'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: '日记', icon: '📅' },
  { href: '/chat', label: '聊天', icon: '💬' },
  { href: '/draw', label: '画板', icon: '🎨' },
  { href: '/profile', label: '我的', icon: '👤' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* 温暖浮岛导航 */}
      <div className="flex items-center px-1 py-1.5 bg-white/90 backdrop-blur-xl rounded-[28px] shadow-xl shadow-gray-200/50 border border-white/60">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative flex flex-col items-center justify-center w-16 h-12 rounded-2xl mx-0.5
              transition-all duration-300
              ${pathname === item.href 
                ? 'text-rose-500' 
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
          >
            {pathname === item.href && (
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl shadow-sm" />
            )}
            <span className="text-xl relative z-10">{item.icon}</span>
            <span className={`text-[10px] font-medium mt-0.5 relative z-10 ${pathname === item.href ? 'text-rose-500' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
