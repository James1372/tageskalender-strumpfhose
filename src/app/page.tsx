import Link from 'next/link'
import { TopNav } from '@/components/nav/TopNav'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let displayName: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role, username').eq('id', user.id).single()
    isAdmin = profile?.role === 'admin'
    displayName = profile?.username || user.email?.split('@')[0]
  }

  return (
    <>
      <TopNav isLoggedIn={!!user} isAdmin={isAdmin} displayName={displayName} />
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-5xl mb-4">Kalender Strumpfhose</h1>
        <p className="text-muted-foreground text-lg mb-12">
          Täglich ein exklusives Bild — nur für Abonnenten.
        </p>

        {/* Blurred teaser */}
        <div className="relative rounded-lg overflow-hidden mb-8 aspect-[4/3] bg-card border border-border">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50" />
          <div className="absolute inset-0 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <Lock className="h-8 w-8 text-gold" />
            <p className="font-serif text-xl text-gold">Nur für Abonnenten</p>
            <p className="text-muted-foreground text-sm">
              Ab 9,99 €/Monat
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Link href="/feed">
              <Button size="lg" className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto">
                Zum Feed
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/subscribe">
                <Button size="lg" className="bg-gold text-black hover:bg-gold/90 w-full sm:w-auto">
                  Jetzt abonnieren
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Einloggen
                </Button>
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  )
}
