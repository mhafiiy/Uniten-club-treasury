'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import NewTransactionModal from './NewTransactionModal'

interface Transaction {
  id: string
  created_at: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  user_email: string
  club_name?: string
}

interface Props {
  userEmail: string
  totalFunds: number
  transactions: Transaction[]
}

export default function DashboardClientWrapper({ userEmail, transactions }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterClub, setFilterClub] = useState('All')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uniqueClubs = ['All', ...Array.from(new Set(transactions.map(tx => tx.club_name || 'Uncategorized')))]

  const filteredTransactions = transactions.filter(tx => 
    filterClub === 'All' ? true : (tx.club_name || 'Uncategorized') === filterClub
  )

  const displayFunds = filteredTransactions.reduce((acc, curr) => {
    return curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount)
  }, 0)

  // New function to handle deleting from Supabase
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return

    setIsDeleting(id)

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    setIsDeleting(null)

    if (error) {
      alert('Error deleting transaction: ' + error.message)
    } else {
      router.refresh() // Instantly updates the dashboard data from the server
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">UNITEN Smart Treasury Dashboard</h1>
            <p className="text-slate-500 mt-1">Authorized Access: {userEmail}</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center gap-3">
            <select
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 w-full sm:w-auto"
            >
              {uniqueClubs.map(club => (
                <option key={club} value={club}>
                  {club === 'All' ? 'View All Organizations' : club}
                </option>
              ))}
            </select>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap"
            >
              + New Transaction
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-medium text-slate-500 text-sm">
              {filterClub === 'All' ? 'Total Club Funds' : `${filterClub} Funds`}
            </h3>
            <p className={`text-3xl font-bold mt-2 ${displayFunds < 0 ? 'text-red-600' : 'text-slate-900'}`}>
              RM {displayFunds.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-medium text-slate-500 text-sm">Automated Auditing Status</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <p className="text-xl font-bold text-slate-900">System Active</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-medium text-slate-500 text-sm">Recorded Transactions</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{filteredTransactions.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Financial Activity</h2>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-lg">
              <p className="text-slate-500">No transactions found for this selection.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="py-4 flex justify-between items-center hover:bg-slate-50 px-2 rounded-lg transition-colors -mx-2 group">
                  <div>
                    <p className="font-medium text-slate-900">{tx.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.club_name || 'Uncategorized'} • {tx.user_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-slate-900'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} RM {Number(tx.amount).toFixed(2)}
                    </div>
                    {/* New Delete Button that only shows when you hover over the row */}
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={isDeleting === tx.id}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm font-medium transition-opacity disabled:opacity-50 px-2 py-1 bg-red-50 rounded"
                    >
                      {isDeleting === tx.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userEmail={userEmail} 
      />
    </div>
  )
}