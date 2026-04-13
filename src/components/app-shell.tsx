import type { ReactNode } from 'react'
import NavBar from './nav-bar'

type AppShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <NavBar />
      <header className="shell-header">
        <h1 className="shell-title">{title}</h1>
        <p className="shell-subtitle">{subtitle}</p>
      </header>
      <section className="stack">{children}</section>
    </div>
  )
}
