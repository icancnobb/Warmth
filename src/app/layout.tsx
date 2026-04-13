import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Warmth',
  description: 'Warmth is a calm personal companion for journaling, reflection, and creative release.',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
