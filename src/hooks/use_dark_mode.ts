'use client'

import { useState, useEffect, useCallback } from 'react'

export function useDarkMode() {
  const [is_dark, set_is_dark] = useState(false)
  const [mounted, set_mounted] = useState(false)

  useEffect(() => {
    set_mounted(true)
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      const enabled = saved === 'true'
      set_is_dark(enabled)
      document.documentElement.classList.toggle('dark', enabled)
    } else {
      const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      set_is_dark(prefers_dark)
      document.documentElement.classList.toggle('dark', prefers_dark)
    }
  }, [])

  const toggle = useCallback(() => {
    set_is_dark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('darkMode', String(next))
      return next
    })
  }, [])

  return { is_dark, toggle, mounted }
}
