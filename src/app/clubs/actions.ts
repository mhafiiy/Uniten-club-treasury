'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isClubCategory } from '@/lib/club-categories'

export async function registerClub(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')
  const { data: memberships, error } = await supabase.from('members').select('role').eq('user_id', user.id)
  if (error || !memberships?.some(m => m.role === 'admin')) redirect('/clubs?registration=denied')
  const rawName = formData.get('name')
  const category = formData.get('category')
  const name = typeof rawName === 'string' ? rawName.trim() : ''
  if (!name || name.length > 160 || !isClubCategory(category)) redirect('/clubs?registration=invalid')
  const { error: insertError } = await supabase.from('clubs').insert({ name, category })
  if (insertError) redirect(insertError.code === '23505' ? '/clubs?registration=duplicate' : '/clubs?registration=failed')
  revalidatePath('/clubs')
  redirect('/clubs?registration=success')
}
