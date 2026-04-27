import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { callAI } from '@/lib/ai'

interface AiButtonProps {
  getPrompt: () => string
  onResult: (text: string) => void
  className?: string
}

export function AiButton({ getPrompt, onResult, className }: AiButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await callAI(getPrompt())
      onResult(result)
    } catch (e) {
      alert('AI 오류: ' + (e instanceof Error ? e.message : '알 수 없는 오류'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50 ${className ?? ''}`}
    >
      {loading
        ? <span className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
        : <Sparkles className="w-3 h-3" />
      }
      {loading ? 'AI 생성 중…' : 'AI 작성'}
    </button>
  )
}
