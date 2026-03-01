// [CYCL:60fb2df9-3c36-4d06-a33b-402e58d8e1ad] Shared layout for auth pages — centered card, no nav
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">HabitPack</h1>
          <p className="text-sm text-[#5c5880] mt-1">Build habits together</p>
        </div>
        <div className="bg-[#13112b] border border-[#2e2a5e] rounded-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
