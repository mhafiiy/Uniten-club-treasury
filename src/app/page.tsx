import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DashboardClientWrapper from '../components/DashboardClientWrapper'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: membership, error: membershipError } = await supabase
    .from('treasury_memberships')
    .select('role, club_name')
    .eq('user_id', user.id)

  if (membershipError || !membership || membership.length === 0) {
    throw new Error('Treasury access has not been granted. Contact an administrator.')
  }

  const isAdmin = membership.some(m => m.role === 'administrator')
  const exportableClubs = isAdmin ? null : membership.filter(m => ['club_treasurer', 'auditor'].includes(m.role)).map(m => m.club_name).filter((name): name is string => !!name)
  const editableClubs = isAdmin
    ? null
    : membership.filter(m => m.role === 'club_treasurer').map(m => m.club_name).filter((name): name is string => !!name)

  // Fetch financial data securely from Supabase
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })

  if (transactionsError || transactions === null) {
    throw new Error('Unable to load treasury transactions')
  }

  // Calculate automated treasury balance
  const totalFunds = transactions?.reduce((acc, curr) => {
    return curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount)
  }, 0) || 0

  return (
    <DashboardClientWrapper 
      userEmail={user.email!} 
      totalFunds={totalFunds} 
      transactions={transactions || []}
      isAdmin={isAdmin}
      editableClubs={editableClubs}
      exportableClubs={exportableClubs} 
    />
  )
}