# Admin-Abonnenten-Übersicht — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue read-only Seite `/admin/abonnenten` mit einer Tabelle aller Abonnements (E-Mail, Plan, Preis, Dauer, Beginn, Laufzeitende, Status).

**Architecture:** Server Component fetcht Daten via Supabase JOIN über `subscriptions`, `profiles` und `subscription_plans` — gleiche Struktur wie `/admin/user`. Client Component rendert die Tabelle. Nav-Link wird in `layout.tsx` ergänzt.

**Tech Stack:** Next.js 16, Supabase (admin client), date-fns, TypeScript, Tailwind CSS

---

## Dateiübersicht

| Aktion | Datei | Zweck |
|--------|-------|-------|
| Neu | `src/components/admin/SubscriptionsTableClient.tsx` | Tabellen-Darstellung |
| Neu | `src/app/(admin)/admin/abonnenten/page.tsx` | Server Component, Daten fetchen |
| Ändern | `src/app/(admin)/layout.tsx` | Nav-Link "Abonnenten" |
| Ändern | `src/__tests__/build.test.ts` | Neue Dateien in Struktur-Check |

---

## Task 1: SubscriptionsTableClient

**Files:**
- Create: `src/components/admin/SubscriptionsTableClient.tsx`
- Modify: `src/__tests__/build.test.ts`

- [ ] **Schritt 1: Failing test schreiben**

In `src/__tests__/build.test.ts` im Block `it('has all admin pages', ...)` ergänzen:

```ts
expect(existsSync(join(root, 'src/components/admin/SubscriptionsTableClient.tsx'))).toBe(true)
```

- [ ] **Schritt 2: Test ausführen — muss fehlschlagen**

```bash
npm test -- --testPathPattern=build
```

Erwartet: FAIL — `Expected: true, Received: false`

- [ ] **Schritt 3: Komponente erstellen**

`src/components/admin/SubscriptionsTableClient.tsx`:

```tsx
'use client'
import { format } from 'date-fns'

type Subscription = {
  id: string
  status: string
  created_at: string
  current_period_end: string | null
  profiles: { email: string } | null
  subscription_plans: {
    label: string
    duration_months: number
    price_eur: number
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  active: 'text-green-400',
  grace: 'text-orange-400',
  past_due: 'text-yellow-400',
  canceled: 'text-muted-foreground',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  grace: 'Toleranz',
  past_due: 'Ausstehend',
  canceled: 'Gekündigt',
}

export function SubscriptionsTableClient({ subscriptions }: { subscriptions: Subscription[] }) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Noch keine Abonnements.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3 pr-6 font-normal">E-Mail</th>
            <th className="pb-3 pr-6 font-normal">Plan</th>
            <th className="pb-3 pr-6 font-normal">Preis</th>
            <th className="pb-3 pr-6 font-normal">Dauer</th>
            <th className="pb-3 pr-6 font-normal">Beginn</th>
            <th className="pb-3 pr-6 font-normal">Läuft bis</th>
            <th className="pb-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => (
            <tr key={sub.id} className="border-b border-border/50">
              <td className="py-3 pr-6">{sub.profiles?.email ?? '—'}</td>
              <td className="py-3 pr-6">{sub.subscription_plans?.label ?? '—'}</td>
              <td className="py-3 pr-6">
                {sub.subscription_plans
                  ? `${sub.subscription_plans.price_eur.toFixed(2).replace('.', ',')} €`
                  : '—'}
              </td>
              <td className="py-3 pr-6">
                {sub.subscription_plans
                  ? `${sub.subscription_plans.duration_months} Monate`
                  : '—'}
              </td>
              <td className="py-3 pr-6">
                {format(new Date(sub.created_at), 'dd.MM.yyyy')}
              </td>
              <td className="py-3 pr-6">
                {sub.current_period_end
                  ? format(new Date(sub.current_period_end), 'dd.MM.yyyy')
                  : '—'}
              </td>
              <td className="py-3">
                <span className={STATUS_STYLES[sub.status] ?? 'text-muted-foreground'}>
                  {STATUS_LABELS[sub.status] ?? sub.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Schritt 4: Tests ausführen — müssen bestehen**

```bash
npm test
```

Erwartet: alle bestehen

- [ ] **Schritt 5: Commit**

```bash
git add src/components/admin/SubscriptionsTableClient.tsx src/__tests__/build.test.ts
git commit -m "feat: add SubscriptionsTableClient component"
```

---

## Task 2: Admin-Seite + Nav-Link

**Files:**
- Create: `src/app/(admin)/admin/abonnenten/page.tsx`
- Modify: `src/app/(admin)/layout.tsx`
- Modify: `src/__tests__/build.test.ts`

- [ ] **Schritt 1: Failing test schreiben**

In `src/__tests__/build.test.ts` im Block `it('has all admin pages', ...)` ergänzen:

```ts
expect(existsSync(join(root, 'src/app/(admin)/admin/abonnenten/page.tsx'))).toBe(true)
```

- [ ] **Schritt 2: Test ausführen — muss fehlschlagen**

```bash
npm test -- --testPathPattern=build
```

Erwartet: FAIL — `Expected: true, Received: false`

- [ ] **Schritt 3: Admin-Seite erstellen**

`src/app/(admin)/admin/abonnenten/page.tsx`:

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { SubscriptionsTableClient } from '@/components/admin/SubscriptionsTableClient'

export default async function AbonnentenPage() {
  const admin = createAdminClient()

  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select(`
      id, status, created_at, current_period_end,
      profiles!subscriptions_user_id_fkey(email),
      subscription_plans(label, duration_months, price_eur)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Abonnenten</h1>
      <SubscriptionsTableClient subscriptions={subscriptions ?? []} />
    </div>
  )
}
```

- [ ] **Schritt 4: Nav-Link ergänzen**

In `src/app/(admin)/layout.tsx` nach dem "User"-Link einfügen:

```tsx
<Link href="/admin/abonnenten" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
  Abonnenten
</Link>
```

Der Nav soll danach lauten:
```
Dashboard · Bilder · User · Abonnenten · Abo-Preise · → Feed
```

- [ ] **Schritt 5: TypeScript-Check**

```bash
npx tsc --noEmit
```

Erwartet: keine Fehler

- [ ] **Schritt 6: Tests ausführen — müssen bestehen**

```bash
npm test
```

Erwartet: alle bestehen

- [ ] **Schritt 7: Commit**

```bash
git add src/app/(admin)/admin/abonnenten/page.tsx src/app/(admin)/layout.tsx src/__tests__/build.test.ts
git commit -m "feat: add admin subscription overview page and nav link"
```
