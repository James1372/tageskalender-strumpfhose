import { TopNav } from '@/components/nav/TopNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function SubscriberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav isLoggedIn />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <main className="flex-1 min-w-0">{children}</main>
          <aside className="w-72 shrink-0 hidden lg:block">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  )
}
