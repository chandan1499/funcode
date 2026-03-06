import { useAuth } from '@/hooks/useAuth'
import { Code2, Zap, Trophy, Users } from 'lucide-react'

export function LoginPage() {
  const { signInWithGoogle, loading } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0d1f15 50%, #0d1117 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Code2 size={40} className="text-green-400" />
            <h1 className="text-4xl font-bold text-white">FunCode</h1>
          </div>
          <p className="text-gray-400 text-lg">Practice DSA. Compete in weekly rooms. Level up.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Zap size={20} className="text-yellow-400" />, label: 'AI-Generated', sub: 'unique variants' },
            { icon: <Trophy size={20} className="text-green-400" />, label: 'Weekly Rooms', sub: 'compete & rank' },
            { icon: <Users size={20} className="text-blue-400" />, label: '5 Levels', sub: 'beginner to pro' },
          ].map((f) => (
            <div key={f.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">{f.icon}</div>
              <div className="text-white text-xs font-semibold">{f.label}</div>
              <div className="text-gray-500 text-xs">{f.sub}</div>
            </div>
          ))}
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in you agree to compete fairly and not use external tools during active rooms.
        </p>
      </div>
    </div>
  )
}
