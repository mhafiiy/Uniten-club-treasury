import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app-shell'
import ReceiptLink from '@/components/ReceiptLink'

type Transaction = {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  club_name: string | null
  category: string | null
  created_at: string | null
  voided_at: string | null
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(amount)

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams
  const search = (params.q ?? '').trim().slice(0, 100).toLocaleLowerCase()
  const typeFilter = params.type === 'INCOME' || params.type === 'EXPENSE' ? params.type : 'ALL'
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // Supabase RLS restricts this query to the user's authorised clubs.
  // Never use the service-role client for this page.
  const { data, error } = await supabase
    .from('transactions')
    .select('id, description, amount, type, club_name, category, created_at, voided_at')
    .order('created_at', { ascending: false })

  const transactions = (data ?? []) as Transaction[]
  const { data: receiptRows, error: receiptError } = await supabase
    .from('transaction_receipts')
    .select('transaction_id, storage_path')
  const receiptPaths = new Map((receiptRows ?? []).map((receipt) => [receipt.transaction_id, receipt.storage_path]))
  const active = transactions.filter((item) => !item.voided_at)
  const visible = transactions.filter((item) => (typeFilter === 'ALL' || item.type === typeFilter) && (!search || [item.description, item.club_name ?? '', item.category ?? ''].some((value) => value.toLocaleLowerCase().includes(search))))
  const income = active.filter((item) => item.type === 'INCOME').reduce((sum, item) => sum + Number(item.amount), 0)
  const expenses = active.filter((item) => item.type === 'EXPENSE').reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <AppShell email={user.email ?? ''}>
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Financial records for clubs you are authorised to access.
            </p>
          </div>
          <a href="/" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            + New transaction (Dashboard)
          </a>
        </div>

        {(error || receiptError) && (
          <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
            Transactions could not be loaded. Please try again later.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total income', value: income, sign: '+' },
            { label: 'Total expenses', value: expenses, sign: '−' },
            { label: 'Net balance', value: income - expenses, sign: '' },
          ].map((summary) => (
            <div key={summary.label} className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">{summary.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{summary.sign}{money(summary.value)}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border bg-card" aria-label="Transaction history">
          <form action="/transactions" method="get" className="flex flex-wrap items-end gap-3 border-b px-5 py-4">
            <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-sm">
              Search transactions
              <input name="q" type="search" defaultValue={params.q ?? ''} maxLength={100} placeholder="Description, club or category" className="rounded-md border bg-background px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Transaction type
              <select name="type" defaultValue={typeFilter} className="rounded-md border bg-background px-3 py-2">
                <option value="ALL">All types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </label>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Filter</button>
            <a href="/transactions" className="rounded-md border px-4 py-2 text-sm">Clear</a>
          </form>
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Transaction history</h2>
            <p className="text-sm text-muted-foreground">Voided entries are retained for accountability but excluded from totals.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Date</th>
                  <th scope="col" className="px-5 py-3 font-medium">Description</th>
                  <th scope="col" className="px-5 py-3 font-medium">Club</th>
                  <th scope="col" className="px-5 py-3 font-medium">Type</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-5 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((item) => (
                  <tr key={item.id} className={item.voided_at ? 'opacity-60' : ''}>
                    <td className="whitespace-nowrap px-5 py-3">{item.created_at ? new Intl.DateTimeFormat('en-MY', { dateStyle: 'medium', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(item.created_at)) : '—'}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{item.description}</span>
                      {item.voided_at && <span className="ml-2 text-xs text-muted-foreground">(Voided)</span>}
                    </td>
                    <td className="px-5 py-3">{item.club_name || '—'}</td>
                    <td className="px-5 py-3">{item.type === 'INCOME' ? 'Income' : 'Expense'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      {item.type === 'INCOME' ? '+' : '−'}{money(Number(item.amount))}
                    </td>
                    <td className="px-5 py-3">{receiptPaths.get(item.id) ? <ReceiptLink path={receiptPaths.get(item.id)!} /> : <span className="text-muted-foreground">{item.type === 'EXPENSE' ? 'Legacy / missing' : '—'}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!error && visible.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                No matching transactions are available for your account.
              </p>
            )}
          </div>
        </section>
        <p className="text-sm text-muted-foreground">
          Create transactions from the Dashboard. New expenses require receipts. Older transactions may not have supporting files.
        </p>
      </main>
    </AppShell>
  )
}
