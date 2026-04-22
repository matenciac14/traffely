export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-foreground tracking-tight">Traffely</p>
          <p className="text-sm text-muted-foreground mt-1">Gestión de campañas Meta Ads</p>
        </div>
        {children}
      </div>
    </div>
  )
}
