import { existsSync } from 'fs'
import { join } from 'path'

const root = join(__dirname, '../..')

describe('Project structure', () => {
  it('has required source files', () => {
    expect(existsSync(join(root, 'src/app/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src/lib/supabase/client.ts'))).toBe(true)
    expect(existsSync(join(root, 'src/lib/supabase/server.ts'))).toBe(true)
    expect(existsSync(join(root, 'src/lib/stripe.ts'))).toBe(true)
    expect(existsSync(join(root, 'src/proxy.ts'))).toBe(true)
  })

  it('has all admin pages', () => {
    expect(existsSync(join(root, 'src/app/(admin)/admin/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src/app/(admin)/admin/bilder/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src/app/(admin)/admin/user/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src/app/(admin)/admin/abos/page.tsx'))).toBe(true)
  })

  it('has all subscriber pages', () => {
    expect(existsSync(join(root, 'src/app/(subscriber)/feed/page.tsx'))).toBe(true)
    expect(existsSync(join(root, 'src/app/(subscriber)/archiv/[jahr]/[monat]/page.tsx'))).toBe(true)
  })

  it('has database migrations', () => {
    expect(existsSync(join(root, 'supabase/migrations/20260510000001_initial_schema.sql'))).toBe(true)
    expect(existsSync(join(root, 'supabase/migrations/20260510000002_rls_and_triggers.sql'))).toBe(true)
    expect(existsSync(join(root, 'supabase/functions/daily-cron/index.ts'))).toBe(true)
  })
})
