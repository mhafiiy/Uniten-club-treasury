import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClientWrapper from '../components/DashboardClientWrapper'
import AppShell from '@/components/app-shell'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Only club treasurers and administrators may create transactions.
  const { data: memberships } = await supabase
    .from('members')
    .select('club_id, role')
    .eq('user_id', user.id)

  const canManageAll = memberships?.some((membership) => membership.role === 'admin') ?? false
  const treasurerClubIds = (memberships ?? [])
    .filter((membership) => membership.role === 'treasurer' && membership.club_id)
    .map((membership) => membership.club_id as string)

  const { data: manageableClubs } = canManageAll
    ? await supabase.from('clubs').select('id, name').order('name')
    : treasurerClubIds.length > 0
      ? await supabase.from('clubs').select('id, name').in('id', treasurerClubIds).order('name')
      : { data: [] as { id: string; name: string }[] }

  // Fetch financial data securely from Supabase
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  // Calculate automated treasury balance
  const totalFunds = transactions?.reduce((acc, curr) => {
    return curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount)
  }, 0) || 0

  return (
    <AppShell email={user.email!}>
      <DashboardClientWrapper 
      userEmail={user.email!}
      allowedClubs={(manageableClubs ?? []).map((club) => club.name)} 
      totalFunds={totalFunds} 
      transactions={transactions || []} 
    />
    </AppShell>
  )
}