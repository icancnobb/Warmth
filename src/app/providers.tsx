'use client'

import { AppProvider } from '@/context/AppContext'
import Navigation from '@/components/Navigation'

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <Navigation />
      {children}
    </AppProvider>
  )
}