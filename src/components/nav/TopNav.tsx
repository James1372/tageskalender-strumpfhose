'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, ShieldCheck, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function TopNav({ isLoggedIn = false, isAdmin = false, displayName }: {
  isLoggedIn?: boolean
  isAdmin?: boolean
  displayName?: string
}) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-widest text-gold">
          BELLA BIANCA
        </Link>
        <div className="flex items-center gap-3">
          {displayName && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hallo, <span className="text-foreground font-medium">{displayName}</span>
            </span>
          )}
          <Button variant="ghost" size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin/bilder">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/feed">
                <Button variant="outline" size="sm">Feed</Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Abmelden</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/subscribe">
                <Button size="sm" className="bg-gold text-black hover:bg-gold/90">
                  Abonnieren
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
