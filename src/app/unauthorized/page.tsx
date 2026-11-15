import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-slate-900">Treasury access not assigned</h1>
        <p className="mt-3 text-slate-600">
          Your UNITEN account is authenticated, but no treasury role has been assigned yet.
          Contact a treasury administrator if you need access.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
