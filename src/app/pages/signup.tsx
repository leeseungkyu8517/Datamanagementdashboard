import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', displayName: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    if (form.password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) { setError('아이디는 영문·숫자·밑줄(_)만 사용 가능합니다.'); return }
    setLoading(true)
    const err = await signUp(form.username, form.displayName, form.password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080f0a] relative overflow-hidden">
      {/* 배경 오브 */}
      <div className="absolute top-[-15%] right-[-8%] w-[700px] h-[700px] rounded-full bg-emerald-700/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-green-700/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">

          {/* 로고 */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mb-4 shadow-[0_8px_32px_rgba(16,185,129,0.4)]">
              <span className="text-white font-black text-xl tracking-tighter">B</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">회원가입</h1>
            <p className="text-sm text-white/35 mt-1 font-medium">BRYCEN Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-2 uppercase tracking-widest">아이디</label>
              <input
                type="text"
                value={form.username}
                onChange={set('username')}
                placeholder="영문·숫자·밑줄 조합"
                required
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.09] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-2 uppercase tracking-widest">이름</label>
              <input
                type="text"
                value={form.displayName}
                onChange={set('displayName')}
                placeholder="실명을 입력하세요"
                required
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.09] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-2 uppercase tracking-widest">비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="6자 이상"
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.09] transition-all"
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

            <div>
              <label className="block text-[11px] font-bold text-white/40 mb-2 uppercase tracking-widest">비밀번호 확인</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={set('confirm')}
                placeholder="비밀번호를 다시 입력하세요"
                required
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.09] transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 transition-all shadow-[0_4px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_32px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  가입 중…
                </span>
              ) : '가입하기'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/25">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
