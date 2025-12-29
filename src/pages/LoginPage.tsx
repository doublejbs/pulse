import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const LoginPage = () => {
  const [loading, setLoading] = useState(false)

  const handleKakaoLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `https://qvuqueewtlbsdyzqsdnp.supabase.co/auth/v1/callback`,
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('카카오 로그인 실패:', error)
      alert('로그인에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-medium text-gray-900 dark:text-white mb-2">
            pulse
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            실시간 주제 기반 커뮤니티
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] px-6 py-4 rounded-lg font-medium hover:bg-[#FDD835] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>로그인 중...</span>
            ) : (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 0C4.477 0 0 3.582 0 8c0 2.797 1.823 5.277 4.546 6.73L3.636 19.09c-.122.39.28.7.57.44l2.182-1.636C7.182 18.182 8.545 18.364 10 18.364c5.523 0 10-3.582 10-8S15.523 0 10 0z"
                    fill="currentColor"
                  />
                </svg>
                <span>카카오로 로그인</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

