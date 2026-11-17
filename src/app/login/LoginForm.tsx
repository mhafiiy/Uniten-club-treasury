"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { isStudentEmail, OAUTH_PROVIDER } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ERROR_MESSAGES: Record<string, string> = {
  domain: 'Only UNITEN student accounts and approved administrators may sign in after the volunteer testing period.',
  auth: 'Sign in failed. Please try again.',
}

export default function LoginForm({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(error ? ERROR_MESSAGES[error] || ERROR_MESSAGES.auth : '')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage('')
    setSuccess(false)
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

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setSuccess(false)
    if (!isStudentEmail(email)) {
      setMessage('Enter your official @student.uniten.edu.my email address.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        shouldCreateUser: true,
      },
    })
    if (error) {
      setMessage('Unable to send the verification email. Please try again or contact the administrator.')
    } else {
      setSuccess(true)
      setMessage('Check your UNITEN inbox for the secure sign-in link or code.')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-900">UNITEN Smart Treasury</CardTitle>
          <CardDescription>Club Financial Management &amp; Auditing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-700 text-center">
              UNITEN students may use email verification. During volunteer testing, personal Gmail accounts can also use Google sign-in until 24 November 2026 (UTC). Volunteers receive no financial permissions automatically.
            </p>
            {message && (
              <div role="status" className={`p-3 text-sm rounded-md ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <label htmlFor="student-email" className="block text-sm font-medium text-slate-700">UNITEN student email</label>
              <input
                id="student-email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@student.uniten.edu.my"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                disabled={loading}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : 'Send secure sign-in link'}
              </Button>
            </form>
            <div className="flex items-center gap-3 text-xs text-slate-500"><div className="h-px flex-1 bg-slate-200" />OR<div className="h-px flex-1 bg-slate-200" /></div>
            <Button type="button" onClick={handleGoogleLogin} className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : 'Continue with Google'}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-center text-slate-500 justify-center">
          Signing in does not grant club or financial permissions. Access requires an authorised role.
        </CardFooter>
      </Card>
    </div>
  )
}
