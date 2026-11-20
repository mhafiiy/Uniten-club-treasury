'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

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
  allowedClubs: string[]
  transactionToEdit?: Transaction | null
}

export default function NewTransactionModal({ isOpen, onClose, userEmail, allowedClubs, transactionToEdit }: ModalProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [club, setClub] = useState(allowedClubs[0] ?? '')
  const [category, setCategory] = useState(CATEGORY_LIST[0])
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /* eslint-disable react-hooks/set-state-in-effect -- Pre-existing modal form reset on edit/open; refactor separately. */
  useEffect(() => {
    if (transactionToEdit) {
      setDescription(transactionToEdit.description)
      setAmount(transactionToEdit.amount.toString())
      setType(transactionToEdit.type)
      setClub(transactionToEdit.club_name || allowedClubs[0] || '')
      setCategory(transactionToEdit.category || CATEGORY_LIST[0])
    } else {
      setDescription('')
      setAmount('')
      setType('EXPENSE')
      setClub(allowedClubs[0] ?? '')
      setCategory(CATEGORY_LIST[0])
    }
  }, [transactionToEdit, isOpen, allowedClubs])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowedClubs.includes(club)) {
      alert('You are not authorised to manage transactions for this club.')
      return
    }
    if (!transactionToEdit && type === 'EXPENSE' && !receipt) { setFormError('Expense receipt is required.'); return }
    if (receipt && (receipt.size === 0 || receipt.size > 10485760 || !['application/pdf','image/jpeg','image/png','image/webp'].includes(receipt.type))) { setFormError('Receipt must be PDF, JPG, PNG or WebP, up to 10 MB.'); return }
    setFormError('')
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
      const transactionId = crypto.randomUUID()
      let storagePath: string | null = null
      if (receipt) {
        const extension = receipt.type === 'application/pdf' ? 'pdf' : receipt.type === 'image/jpeg' ? 'jpg' : receipt.type === 'image/png' ? 'png' : 'webp'
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) { setFormError('Please sign in again before uploading a receipt.'); setLoading(false); return }
        storagePath = user.id + '/' + transactionId + '/' + crypto.randomUUID() + '.' + extension
        const uploaded = await supabase.storage.from('treasury-receipts').upload(storagePath, receipt, { contentType: receipt.type, upsert: false })
        if (uploaded.error) { setFormError('Receipt upload failed: ' + uploaded.error.message); setLoading(false); return }
      }
      const { error } = await supabase.rpc('create_treasury_transaction', {
        p_id: transactionId,
        p_description: description,
        p_amount: Number(amount),
        p_type: type,
        p_club_name: club,
        p_category: category,
        p_storage_path: storagePath,
        p_original_filename: receipt?.name ?? null,
        p_content_type: receipt?.type ?? null,
        p_file_size_bytes: receipt?.size ?? null,
      })
      if (error && storagePath) {
        setFormError('Transaction not saved: ' + error.message + '. The staged receipt may require cleanup by an administrator.')
      }

      setLoading(false)

      if (error) {
        setFormError('Error saving transaction: ' + error.message)
      } else {
        setReceipt(null)
        setDescription('')
        setAmount('')
        setType('EXPENSE')
        setClub(allowedClubs[0] ?? '')
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
              {allowedClubs.map((clubName) => (
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

          {!transactionToEdit && <div>
            <label htmlFor="receipt-upload" className="block text-sm font-medium text-slate-700 mb-1">Receipt {type === 'EXPENSE' ? '(required)' : '(optional)'}</label>
            <input id="receipt-upload" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required={type === 'EXPENSE'} onChange={event => setReceipt(event.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-700" />
            <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG or WebP, up to 10 MB.</p>
          </div>}
          {formError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
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
              disabled={loading || allowedClubs.length === 0}
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