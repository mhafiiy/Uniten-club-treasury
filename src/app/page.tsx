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
    />
  )
}