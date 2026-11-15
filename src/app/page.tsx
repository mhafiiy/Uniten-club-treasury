import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DashboardClientWrapper from '../components/DashboardClientWrapper'

type Membership = {
  role: 'treasurer' | 'president' | 'auditor' | 'admin' | 'viewer'
  clubs: { name: string }[] | null
}

export default async function DashboardPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  const { data: membershipData, error: membershipError } = await supabase
    .from('members')
    .select('role, clubs(name)')
    .eq('user_id', user.id)

  if (membershipError) throw new Error('Unable to load treasury permissions')

  const memberships = (membershipData || []) as Membership[]
  if (memberships.length === 0) redirect('/unauthorized')

  const isAdmin = memberships.some(m => m.role === 'admin')
  const clubNamesFor = (roles: Membership['role'][]) =>
    memberships
      .filter(m => roles.includes(m.role))
      .map(m => m.clubs?.[0]?.name)
      .filter((name): name is string => Boolean(name))

  const editableClubs = isAdmin ? null : clubNamesFor(['treasurer'])
  const exportableClubs = isAdmin ? null : clubNamesFor(['treasurer', 'auditor'])

  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('name')
    .order('name')

  if (clubsError) throw new Error('Unable to load clubs')

  const availableClubs = isAdmin
    ? (clubs || []).map(c => c.name)
    : editableClubs || []

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (transactionsError || transactions === null) {
    throw new Error('Unable to load treasury transactions')
  }

  return (
    <DashboardClientWrapper
      userEmail={user.email!}
      transactions={transactions}
      isAdmin={isAdmin}
      editableClubs={editableClubs}
      exportableClubs={exportableClubs}
      availableClubs={availableClubs}
    />
  )
}
