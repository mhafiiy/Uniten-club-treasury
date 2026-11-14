'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const CLUB_LIST = [
  "Persatuan Silat Seni Gayong",
  "Sekretariat Rakan Muda",
  "Energy, Economics & Environmental Student Club",
  "Student Representative Council",
  "General Treasury"
]

const CATEGORY_LIST = [
  "Venue & Space Rental",
  "Equipment & Hardware",
  "Marketing & Publicity",
  "Refreshments & Catering",
  "Logistics & Transport",
  "Program Operations",
  "General Administration"
]

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  club_name?: string
  category?: string
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  transactionToEdit?: Transaction | null
}

export default function NewTransactionModal({ isOpen, onClose, userEmail, transactionToEdit }: ModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [club, setClub] = useState(CLUB_LIST[0])
  const [category, setCategory] = useState(CATEGORY_LIST[0])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (transactionToEdit) {
      setDescription(transactionToEdit.description)
      setAmount(transactionToEdit.amount.toString())
      setType(transactionToEdit.type)
      setClub(transactionToEdit.club_name || CLUB_LIST[0])
      setCategory(transactionToEdit.category || CATEGORY_LIST[0])
    } else {
      setDescription('')
      setAmount('')
      setType('EXPENSE')
      setClub(CLUB_LIST[0])
      setCategory(CATEGORY_LIST[0])
    }
  }, [transactionToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (transactionToEdit) {
      const { error } = await supabase
        .from('transactions')
        .update({
          description,
          amount: parseFloat(amount),
          type,
          club_name: club,
          category,
        })
        .eq('id', transactionToEdit.id)

      setLoading(false)

      if (error) {
        alert('Error updating transaction: ' + error.message)
      } else {
        onClose()
        router.refresh()
      }
    } else {
      const { error } = await supabase.from('transactions').insert([
        {
          description,
          amount: parseFloat(amount),
          type,
          club_name: club,
          category,
          user_email: userEmail,
        },
      ])

      setLoading(false)

      if (error) {
        alert('Error saving transaction: ' + error.message)
      } else {
        setDescription('')
        setAmount('')
        setType('EXPENSE')
        setClub(CLUB_LIST[0])
        setCategory(CATEGORY_LIST[0])
        onClose()
        router.refresh()
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">
            {transactionToEdit ? 'Edit Transaction' : 'New Financial Transaction'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization / Club</label>
            <select
              value={club}
              onChange={(e) => setClub(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
            >
              {CLUB_LIST.map((clubName) => (
                <option key={clubName} value={clubName}>
                  {clubName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expense/Income Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Auditorium booking, PA system rental"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
              >
                <option value="INCOME">Income (+)</option>
                <option value="EXPENSE">Expense (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (RM)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}