'use client'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TopNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const { theme, setTheme } = useTheme()
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-widest text-gold">
          BELLA BIANCA
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isLoggedIn ? (
            <Link href="/feed">
              <Button variant="outline" size="sm">Zum Feed</Button>
            </Link>
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
