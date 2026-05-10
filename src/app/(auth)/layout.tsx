export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-center mb-2 text-gold">Bella Bianca</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Kalender Strumpfhose
        </p>
        {children}
      </div>
    </div>
  )
}
