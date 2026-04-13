import AppShell from '@/components/app-shell'
import HomeDashboard from '@/components/home-dashboard'

export default function HomePage() {
  return (
    <AppShell
      title="Warmth"
      subtitle="A rebuilt, modular personal companion for reflection, journaling, and emotional care."
    >
      <HomeDashboard />
    </AppShell>
  )
}
