'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Building2, ShieldCheck, FileBarChart, Settings, Menu, X, Wallet } from 'lucide-react'

const navigation = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/clubs', label: 'Clubs', icon: Building2 },
  { href: '/audit', label: 'Audit', icon: ShieldCheck },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sidebar = (
    <>
      <Link href="/" className="flex items-center gap-3 px-5 py-6 text-white" onClick={() => setOpen(false)}>
        <span className="rounded-xl bg-blue-600 p-2"><Wallet size={20} aria-hidden="true" /></span>
        <span className="font-semibold leading-tight">Smart Treasury<span className="block text-xs font-normal tracking-widest text-blue-200">UNITEN</span></span>
      </Link>
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg border-l-[3px] px-4 py-3 text-sm transition-colors ${active ? 'border-blue-400 bg-white/10 text-white' : 'border-transparent text-blue-100 hover:bg-white/10 hover:text-white'}`}>
            <Icon size={18} aria-hidden="true" />{label}
          </Link>
        })}
      </nav>
      <div className="border-t border-white/10 p-5 text-xs text-blue-100">
        <p className="truncate" title={email}>{email}</p>
        <a className="mt-2 inline-block underline underline-offset-4 hover:text-white" href="mailto:m.hafiiy@gmail.com">Need access? Contact admin</a>
      </div>
    </>
  )
  const title = navigation.find(item => item.href === pathname)?.label || 'Smart Treasury'
  return <div className="min-h-screen bg-background md:pl-64">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar md:flex">{sidebar}</aside>
    {open && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
    <aside id="mobile-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar transition-transform duration-200 md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-hidden={!open}>
      <button className="absolute right-3 top-5 rounded-lg p-2 text-white" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
      {sidebar}
    </aside>
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:px-8">
      <button className="rounded-lg p-2 hover:bg-muted md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation" aria-controls="mobile-navigation" aria-expanded={open}><Menu size={22} /></button>
      <h1 className="text-lg font-semibold">{title}</h1>
      <span className="ml-auto hidden max-w-[40%] truncate text-sm text-muted-foreground sm:block">{email}</span>
    </header>
    <main id="main-content">{children}</main>
  </div>
}
