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
      {/* Apple Design: 材料 - 浮岛导航 */}
      <div className="flex items-center px-1 py-1.5 bg-white/90 backdrop-blur-xl rounded-[24px] shadow-lg border border-white/60">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              relative flex flex-col items-center justify-center w-14 h-11 rounded-[16px] mx-0.5
              transition-all duration-200
              ${pathname === item.href 
                ? 'text-[#007AFF]' 
                : 'text-[#86868B] hover:text-[#1D1D1F]'
              }
            `}
          >
            {pathname === item.href && (
              <div className="absolute inset-0 bg-[#F5F5F7] rounded-[16px] -z-10" />
            )}
            <span className="text-lg leading-none">{item.icon}</span>
            <span className={`text-[10px] font-medium mt-0.5 ${pathname === item.href ? 'text-[#007AFF]' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
