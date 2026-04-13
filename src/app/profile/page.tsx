import AppShell from '@/components/app-shell'
import ProfileForm from '@/features/profile/profile-form'

export default function ProfilePage() {
  return (
    <AppShell
      title="Profile"
      subtitle="Save your personal baseline so Warmth can respond with context."
    >
      <ProfileForm />
    </AppShell>
  )
}
