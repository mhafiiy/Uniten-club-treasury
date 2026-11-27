import { CLUB_CATEGORIES } from '@/lib/club-categories'
import { registerClub } from './actions'
import { redirect } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/server'

const money = (n: number) => new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n)

// Confirmed historical aliases; reporting only, never used to grant access.
function canonicalName(name: string | null) {
  if (name === 'Energy, Economics & Environmental Student Club') return '3ESC'
  if (name === 'Persatuan Silat Seni Gayong') return 'PSSGM UNITEN'
  return name
}

export default async function ClubsPage({ searchParams }: { searchParams: Promise<{ q?: string; registration?: string }> }) {
  const { q, registration } = await searchParams
  const search = typeof q === 'string' ? q.trim().slice(0, 100) : ''
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: memberships, error: membershipError } = await supabase.from('members').select('club_id, role').eq('user_id', user.id)
  const admin = !membershipError && (memberships ?? []).some(m => m.role === 'admin')
  const ids = (memberships ?? []).flatMap(m => m.club_id ? [m.club_id as string] : [])
  const { data: clubs, error: clubError } = admin
    ? await supabase.from('clubs').select('id, name, category').order('name')
    : !membershipError && ids.length
      ? await supabase.from('clubs').select('id, name, category').in('id', ids).order('name')
      : { data: [], error: null }
  const { data: transactions, error: transactionError, count } = await supabase.from('transactions')
    .select('club_name, amount, type', { count: 'exact' }).is('voided_at', null)
  const incomplete = !!transactionError || count === null || count !== (transactions ?? []).length
  const unmatched = admin && !incomplete && !clubError && !membershipError ? (transactions ?? []).filter(t => !(clubs ?? []).some(c => c.name === canonicalName(t.club_name))) : []
  const unmatchedNet = unmatched.reduce((sum, t) => sum + (t.type === 'INCOME' ? Number(t.amount) : t.type === 'EXPENSE' ? -Number(t.amount) : 0), 0)
  const visible = (clubs ?? []).filter(c => [c.name, c.category ?? ''].some(v => v.toLowerCase().includes(search.toLowerCase())))
  return (
    <AppShell email={user.email ?? ''}>
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <header><h1 className="text-2xl font-semibold">Clubs</h1><p className="mt-1 text-sm text-muted-foreground">Directory and financial overview for your authorised clubs.</p></header>
        {admin && !clubError && <details className="rounded-xl border bg-card p-4">
          <summary className="cursor-pointer font-medium">+ Register Club</summary>
          <form action={registerClub} className="mt-4 space-y-4">
            <label className="flex flex-col gap-1 text-sm">Official club name<input name="name" required maxLength={160} className="rounded-md border bg-background px-3 py-2" /></label>
            <label className="flex flex-col gap-1 text-sm">Club category<select name="category" required defaultValue="" className="rounded-md border bg-background px-3 py-2"><option value="" disabled>Select category</option>{CLUB_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
            <p className="text-xs text-muted-foreground">Registration is recorded in the audit log.</p>
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Register Club</button>
          </form>
        </details>}
        {registration && <p role="status" className="rounded-lg border p-3 text-sm">{registration === 'success' ? 'Club registered successfully.' : registration === 'duplicate' ? 'A club with this name already exists.' : registration === 'invalid' ? 'Enter a valid name and category.' : registration === 'denied' ? 'Administrator access required.' : 'Registration could not be completed.'}</p>}
        <form action="/clubs" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">Search clubs<input name="q" defaultValue={search} maxLength={100} type="search" placeholder="Club name or category" className="rounded-md border bg-background px-3 py-2" /></label>
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Search</button>
        </form>
        {(membershipError || clubError) && <p role="alert" className="rounded-lg border p-4 text-destructive">Club directory could not be loaded.</p>}
        {incomplete && <p role="alert" className="rounded-lg border p-4 text-sm">Financial totals are unavailable because the complete transaction data could not be loaded.</p>}
        {unmatched.length > 0 && <aside role="status" className="space-y-1 rounded-lg border p-4 text-sm"><h2 className="font-semibold">Unmatched historical transactions</h2><p>{unmatched.length} visible active transactions do not match a registered club name. Their net balance of {money(unmatchedNet)} is excluded from club cards.</p><p className="text-muted-foreground">Review historical club associations before relying on club-level balances.</p></aside>}
        <p className="text-sm text-muted-foreground">{visible.length} matching clubs</p>
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map(club => {
            const rows = (transactions ?? []).filter(t => canonicalName(t.club_name) === club.name)
            const income = rows.filter(t => t.type === 'INCOME').reduce((s,t) => s + Number(t.amount), 0)
            const expense = rows.filter(t => t.type === 'EXPENSE').reduce((s,t) => s + Number(t.amount), 0)
            const ambiguous = (clubs ?? []).filter(c => c.name === club.name).length !== 1
            return <section key={club.id} className="space-y-4 rounded-xl border bg-card p-5">
              <div><h2 className="text-lg font-semibold">{club.name}</h2><p className="text-sm text-muted-foreground">{club.category || 'Uncategorised'}</p></div>
              {incomplete || ambiguous ? <p className="text-sm text-muted-foreground">Financial totals unavailable.</p> : <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Visible income</dt><dd className="font-medium tabular-nums">{money(income)}</dd></div>
                <div><dt className="text-muted-foreground">Visible expenses</dt><dd className="font-medium tabular-nums">{money(expense)}</dd></div>
                <div className="col-span-2 border-t pt-3"><dt className="text-muted-foreground">Visible net balance</dt><dd className="text-xl font-semibold tabular-nums">{money(income-expense)}</dd></div>
              </dl>}
            </section>
          })}
        </div>
        {!membershipError && !clubError && !visible.length && <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">No matching authorised clubs.</p>}
        <p className="text-xs text-muted-foreground">Totals include only transactions visible under your existing permissions, reconcile confirmed historical club names, and exclude voided entries. Historical names remain unchanged in transaction records. Membership editing is not enabled in this release.</p>
      </main>
    </AppShell>
  )
}
