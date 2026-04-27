import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(username, password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080f0a] relative overflow-hidden">
      {/* 배경 오브 */}
      <div className="absolute top-[-15%] right-[-8%] w-[700px] h-[700px] rounded-full bg-emerald-700/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-700/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[35%] w-[300px] h-[300px] rounded-full bg-lime-700/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">

          {/* 로고 */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mb-5 shadow-[0_8px_32px_rgba(16,185,129,0.4)]">
              <span className="text-white font-black text-2xl tracking-tighter">B</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">BRYCEN</h1>
            <p className="text-sm text-white/35 mt-1.5 font-medium">Data Management Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-2 uppercase tracking-widest">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                required
                autoComplete="username"
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.09] transition-all"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-2 uppercase tracking-widest">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3.5 pr-11 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.09] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 transition-all shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중…
                </span>
              ) : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <p className="mt-7 text-center text-sm text-white/25">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              회원가입
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          © 2026 BRYCEN. All rights reserved.
        </p>
      </div>
    </div>
  )
}
