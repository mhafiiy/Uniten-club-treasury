import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SectionPlaceholder({ title, description }: { title: string; description: string }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')
  return <AppShell email={user.email ?? ''}>
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{description}</p>
          <p className="mt-3 text-sm">This section is being developed. Existing treasury records and permissions remain unchanged.</p>
        </CardContent>
      </Card>
    </div>
  </AppShell>
}
