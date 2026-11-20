'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ReceiptLink({ path }: { path: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function openReceipt() {
    setBusy(true)
    setError('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error: signedError } = await supabase.storage
      .from('treasury-receipts')
      .createSignedUrl(path, 60)
    if (signedError || !data?.signedUrl) {
      setError('Receipt unavailable or access denied.')
    } else {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    }
    setBusy(false)
  }
  return (
    <span>
      <button type="button" onClick={openReceipt} disabled={busy} className="text-primary underline underline-offset-2 disabled:opacity-50">
        {busy ? 'Opening…' : 'View receipt'}
      </button>
      {error && <span role="alert" className="ml-2 text-xs text-destructive">{error}</span>}
    </span>
  )
}
