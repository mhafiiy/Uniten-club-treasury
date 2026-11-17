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
      totalFunds={totalFunds} 
      transactions={transactions || []} 
    />
    </AppShell>
  )
}