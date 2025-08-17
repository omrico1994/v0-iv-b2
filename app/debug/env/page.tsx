export default function DebugEnvPage() {
  const envChecks = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    {
      name: "SUPABASE_URL",
      exists: !!process.env.SUPABASE_URL,
    },
    {
      name: "SUPABASE_ANON_KEY",
      exists: !!process.env.SUPABASE_ANON_KEY,
    },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Variables Debug</h1>

        <div className="space-y-4">
          {envChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between p-4 border rounded-lg">
              <span className="font-mono text-sm">{check.name}</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  check.exists ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {check.exists ? "yes" : "no"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            This page checks for the presence of environment variables without exposing their values. All four variables
            should show "yes" for proper Supabase integration.
          </p>
        </div>
      </div>
    </div>
  )
}
