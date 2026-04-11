'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDarkMode } from '@/hooks/use_dark_mode'

const navItems = [
  { 
    href: '/', 
    label: '日记', 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8A7A">
        <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L20 8l-8 8z"/>
      </svg>
    )
  },
  { 
    href: '/chat', 
    label: '聊天', 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        <path d="M8 10h8M8 14h5"/>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8A7A">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        <circle cx="9" cy="10" r="1" fill="white"/>
        <circle cx="12" cy="10" r="1" fill="white"/>
        <circle cx="15" cy="10" r="1" fill="white"/>
      </svg>
    )
  },
  { 
    href: '/draw', 
    label: '画板', 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8A7A">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <circle cx="11" cy="11" r="3" fill="white" fillOpacity="0.3"/>
      </svg>
    )
  },
  { 
    href: '/profile', 
    label: '我的', 
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    activeIcon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8A7A">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <circle cx="12" cy="7" r="2" fill="white" fillOpacity="0.4"/>
      </svg>
    )
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const { is_dark, toggle, mounted } = useDarkMode()

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* 手绘风底部导航 */}
      <div className="flex items-center px-2 py-2.5 bg-white/95 dark:bg-[#2a2520]/95 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(93,78,71,0.1)] border-2 border-dashed border-[var(--handrawn-border)]">
        <button
          onClick={toggle}
          className="relative flex flex-col items-center justify-center w-12 h-14 rounded-2xl mx-0.5 transition-all duration-300 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          aria-label="切换深色模式"
        >
          {mounted && (
            is_dark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )
          )}
          <span className="text-[9px] font-medium mt-0.5">{mounted && (is_dark ? '浅色' : '深色')}</span>
        </button>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl mx-0.5
                transition-all duration-300
                ${isActive 
                  ? 'text-[#FF8A7A]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {/* 选中状态背景 */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--coral-pale)] to-[var(--peach)] rounded-2xl -z-10" />
              )}
              
              {/* 手绘装饰 - 选中时的小圆点 */}
              {isActive && (
                <div className="absolute -top-1.5 w-2 h-2 bg-gradient-to-br from-[#FF8A7A] to-[#FFB5A8] rounded-full shadow-sm" />
              )}
              
              {/* 图标 */}
              <div className="transform transition-all duration-300" style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
                {isActive ? item.activeIcon : item.icon}
              </div>
              
              {/* 标签 */}
              <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-[#FF8A7A] font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
