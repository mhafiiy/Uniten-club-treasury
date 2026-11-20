'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ReceiptLink({ path }: { path: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [signedUrl, setSignedUrl] = useState('')

  async function prepareReceipt() {
    if (busy) return
    setBusy(true)
    setError('')
    setSignedUrl('')
    try {
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
        setSignedUrl(data.signedUrl)
      }
    } catch {
      setError('Unable to prepare receipt. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span>
      {signedUrl ? (
        <span>
          <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Open receipt
          </a>
          <button type="button" onClick={prepareReceipt} disabled={busy} className="ml-2 text-xs text-muted-foreground underline">
            Refresh link
          </button>
          <span className="ml-2 text-xs text-muted-foreground">Link expires in 60 seconds.</span>
        </span>
      ) : (
        <button type="button" onClick={prepareReceipt} disabled={busy} className="text-primary underline underline-offset-2 disabled:opacity-50">
          {busy ? 'Preparing…' : 'View receipt'}
        </button>
      )}
      {error && <span role="alert" className="ml-2 text-xs text-destructive">{error}</span>}
    </span>
  )
}
