# Design: Admin-Abonnenten-Übersicht

**Datum:** 2026-05-31  
**Status:** Approved

## Ziel

Neue read-only Seite `/admin/abonnenten` mit einer Tabelle aller Abonnements — E-Mail, Plan, Preis, Dauer, Beginn, Laufzeitende und Status. Kein Filter, kein Paging, keine Aktionen. Sortierung: neueste zuerst.

## Architektur

Gleiche Struktur wie `/admin/user`:

| Aktion | Datei | Zweck |
|--------|-------|-------|
| Neu | `src/app/(admin)/admin/abonnenten/page.tsx` | Server Component, fetcht Daten |
| Neu | `src/components/admin/SubscriptionsTableClient.tsx` | Client Component, rendert Tabelle |
| Ändern | `src/app/(admin)/layout.tsx` | Nav-Link "Abonnenten" ergänzen |

## Daten

Supabase-Query (admin client, kein RLS):

```ts
admin
  .from('subscriptions')
  .select(`
    id, status, created_at, current_period_end,
    profiles!subscriptions_user_id_fkey(email),
    subscription_plans(label, duration_months, price_eur)
  `)
  .order('created_at', { ascending: false })
```

## Tabellenspalten

| Spalte | Quelle | Format |
|--------|--------|--------|
| E-Mail | `profiles.email` | Text |
| Plan | `subscription_plans.label` | Text |
| Preis | `subscription_plans.price_eur` | `9,99 €` |
| Dauer | `subscription_plans.duration_months` | `3 Monate` |
| Beginn | `subscriptions.created_at` | `d. MMM yyyy` (de) |
| Läuft bis | `subscriptions.current_period_end` | `d. MMM yyyy` (de), `—` wenn null |
| Status | `subscriptions.status` | Badge (siehe unten) |

## Status-Badges

| Wert | Farbe |
|------|-------|
| `active` | grün (`text-green-400`) |
| `grace` | orange (`text-orange-400`) |
| `past_due` | gelb (`text-yellow-400`) |
| `canceled` | grau (`text-muted-foreground`) |

## Navigation

`src/app/(admin)/layout.tsx` — neuer Link zwischen "User" und "Abo-Preise":

```
Dashboard · Bilder · User · Abonnenten · Abo-Preise · → Feed
```

## Leerer Zustand

Wenn keine Abonnements vorhanden: `"Noch keine Abonnements."` zentriert in der Tabelle.

## Nicht im Scope

- Aktionen (kündigen, verlängern)
- Filter nach Status
- Pagination
- Sortierung per Klick
