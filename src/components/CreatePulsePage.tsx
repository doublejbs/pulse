import { useState } from 'react'

interface CreatePulsePageProps {
  onClose: () => void
  onSubmit: (content: string) => Promise<void>
}

const CreatePulsePage = ({ onClose, onSubmit }: CreatePulsePageProps) => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (content.trim() && !loading) {
      setLoading(true)
      try {
        await onSubmit(content.trim())
        setContent('')
        onClose()
      } catch (error) {
        // 에러는 상위에서 처리
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">
          pulse 만들기
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          닫기
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="주제를 입력하세요..."
          className="w-full h-full p-4 sm:p-6 lg:p-8 text-base text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          autoFocus
        />
      </div>
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || loading}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-900/20 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '생성 중...' : '확인'}
        </button>
      </div>
    </div>
  )
}

export default CreatePulsePage

