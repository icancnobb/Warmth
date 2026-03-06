import ProfileForm from '@/components/ProfileForm'

export const metadata = {
  title: '个人资料 - 心情日记',
  description: '管理个人资料',
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen">
      <ProfileForm />
    </main>
  )
}
