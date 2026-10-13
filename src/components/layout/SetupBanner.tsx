import { AlertTriangle, ExternalLink, Database } from 'lucide-react'

export function SetupBanner() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl border shadow-sm p-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Database not configured</h1>
            <p className="text-sm text-muted-foreground">ObligaTrack needs a Supabase connection to run.</p>
          </div>
        </div>

        {/* Steps */}
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <div>
              <p className="font-medium">Create a free Supabase project</p>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-0.5"
              >
                supabase.com/dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            <div>
              <p className="font-medium">Run the database migration</p>
              <p className="text-muted-foreground mt-0.5">
                In your Supabase project → SQL Editor, paste and run the contents of:
              </p>
              <code className="block mt-1 px-2 py-1 rounded bg-muted text-xs break-all">
                supabase/migrations/001_initial.sql
              </code>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
            <div>
              <p className="font-medium">Add your credentials to <code className="text-xs bg-muted px-1 rounded">.env.local</code></p>
              <p className="text-muted-foreground mt-0.5">
                Project Settings → API → copy Project URL and anon key.
              </p>
              <pre className="mt-2 px-3 py-2 rounded bg-muted text-xs leading-relaxed">{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}</pre>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
            <div>
              <p className="font-medium">Restart the dev server</p>
              <code className="block mt-1 px-2 py-1 rounded bg-muted text-xs">npm run dev</code>
            </div>
          </li>
        </ol>

        {/* After setup note */}
        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs">
          <Database className="h-4 w-4 mt-0.5 shrink-0" />
          <p>After connecting, go to <strong>Settings → Seed Demo Data</strong> to load sample contracts, obligations, and team members.</p>
        </div>
      </div>
    </div>
  )
}
