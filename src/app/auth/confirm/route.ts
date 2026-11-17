import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isStudentEmail } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  if ((!token_hash || type !== 'email') && !code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = await createClient()

  const result = token_hash && type === 'email'
    ? await supabase.auth.verifyOtp({ token_hash, type: 'email' })
    : await supabase.auth.exchangeCodeForSession(code!)

  if (result.error || !result.data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }
  if (!isStudentEmail(result.data.user.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=domain`)
  }
  return NextResponse.redirect(`${origin}/`)
}
