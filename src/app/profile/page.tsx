import ProfileForm from '@/components/ProfileForm'

export const metadata = {
  title: '个人资料 - 心情日记',
  description: '编辑个人资料',
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      <ProfileForm />
    </main>
  )
}
