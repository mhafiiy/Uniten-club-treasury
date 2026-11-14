"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ALLOWED_EMAIL_DOMAINS, OAUTH_PROVIDER } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ERROR_MESSAGES: Record<string, string> = {
  domain: `Only UNITEN student emails (@${ALLOWED_EMAIL_DOMAINS.join(', @')}) can sign in.`,
  auth: 'Sign in failed. Please try again.',
}

export default function LoginForm({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(
    error ? ERROR_MESSAGES[error] || ERROR_MESSAGES.auth : ''
  )
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: OAUTH_PROVIDER,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">UNITEN Smart Treasury</CardTitle>
          <CardDescription>Club Financial Management & Auditing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-700 text-center">
              Sign in with your UNITEN student email
              <br />
              <span className="text-slate-500">({ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(', ')})</span>
            </p>
            {message && (
              <div className="p-3 text-sm rounded-md bg-red-100 text-red-700">
                {message}
              </div>
            )}
            <Button type="button" onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? 'Redirecting...' : 'Sign in with Google'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-center text-slate-500 justify-center">
          Access restricted strictly to authorized UNITEN staff and student representatives.
        </CardFooter>
      </Card>
    </div>
  )
}