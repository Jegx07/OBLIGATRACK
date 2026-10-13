import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/motion/AnimateIn'
import { AlertCircle, Database, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { seedDemoData } from '@/data/seed'
import { useToast } from '@/hooks/useToast'

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const { toast } = useToast()

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const result = await seedDemoData()
      setSeeded(true)
      toast({ title: 'Demo data seeded', description: result })
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Seed failed', description: e.message })
    } finally { setSeeding(false) }
  }

  return (
    <div className="space-y-6">
      <AnimateIn direction="down" duration={0.25}>
        <PageHeader title="Settings" description="Application configuration and utilities." />
      </AnimateIn>

      <StaggerChildren className="space-y-5 max-w-2xl" staggerDelay={0.08} baseDelay={0.05}>
        {/* Database config */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" /> Database Configuration
              </CardTitle>
              <CardDescription>Supabase PostgreSQL connection status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Connected</p>
                  <p className="text-xs text-emerald-700 mt-0.5 font-mono break-all">
                    {import.meta.env.VITE_SUPABASE_URL}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-muted/60 border border-border/60">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Credentials are stored in <code className="bg-background px-1 rounded text-xs border border-border">.env.local</code> and never exposed to the browser bundle. Run the SQL migration in <code className="bg-background px-1 rounded text-xs border border-border">supabase/migrations/001_initial.sql</code> to recreate the schema.
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Demo data */}
        <StaggerItem>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" /> Demonstration Data
              </CardTitle>
              <CardDescription>
                Seed synthetic records for evaluation. Safe to repeat — duplicates are skipped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="grid grid-cols-2 gap-1.5 text-sm text-muted-foreground">
                {[
                  '5 synthetic contracts',
                  '10 synthetic obligations',
                  '4 team members',
                  'Overdue obligation (A)',
                  'Upcoming obligation (B)',
                  'Unassigned obligation (C)',
                  'Missing deadline (D)',
                  'Completed obligation (E)',
                  'Approaching renewal (F)',
                  'High-priority obligation (G)',
                  'Confirmed trigger + duration (H)',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleSeed}
                disabled={seeding}
                loading={seeding}
                variant={seeded ? 'outline' : 'default'}
                className="mt-1"
              >
                {seeded ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Demo Data Seeded</> : 'Seed Demo Data'}
              </Button>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Legal notice */}
        <StaggerItem>
          <Card className="border-amber-200/60 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" /> Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>ObligaTrack is an administrative tracking and prioritisation tool.</p>
              <p>It does not constitute legal advice and must not substitute qualified legal counsel.</p>
              <p>Risk scores are operational prioritisation indicators only — not legal, financial, or contractual risk assessments.</p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerChildren>
    </div>
  )
}
