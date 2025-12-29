import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores/useStore'
import type { Comment } from '@/stores/PostStore'

interface CommentItemProps {
  comment: Comment
  postId: number
}

const CommentItem = observer(({ comment, postId }: CommentItemProps) => {
  const { postStore } = useStore()
  const navigate = useNavigate()
  const [showReplies, setShowReplies] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  const handleToggleLike = async () => {
    try {
      await postStore.toggleCommentLike(comment.id)
    } catch (error) {
      console.error('댓글 좋아요 실패:', error)
      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
        navigate('/login')
      }
    }
  }

  const handleToggleReplies = () => {
    setShowReplies(!showReplies)
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || isSubmittingReply) return

    setIsSubmittingReply(true)
    try {
      await postStore.createComment(postId, replyContent.trim(), comment.id)
      setReplyContent('')
      if (!showReplies) {
        setShowReplies(true)
      }
    } catch (error) {
      console.error('답글 작성 실패:', error)
      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
        navigate('/login')
      } else if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('답글 작성에 실패했습니다.')
      }
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const replies = comment.replies || []

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
        {comment.content}
      </p>
      {comment.created_at && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {new Date(comment.created_at).toLocaleString('ko-KR')}
        </p>
      )}

      {/* 좋아요 및 답글 버튼 */}
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            comment.is_liked
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
          }`}
        >
          <span>{comment.is_liked ? '❤️' : '🤍'}</span>
          <span>{comment.likes_count || 0}</span>
        </button>
        <button
          onClick={handleToggleReplies}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <span>↩️</span>
          <span>답글 {replies.length > 0 ? `(${replies.length})` : ''}</span>
        </button>
      </div>

      {/* 답글 섹션 */}
      {showReplies && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* 답글 입력 */}
          <form onSubmit={handleSubmitReply} className="mb-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요..."
              className="w-full p-2 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-white/20"
              rows={2}
            />
            <button
              type="submit"
              disabled={!replyContent.trim() || isSubmittingReply}
              className="mt-2 px-3 py-1 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingReply ? '작성 중...' : '답글 작성'}
            </button>
          </form>

          {/* 답글 목록 */}
          {replies.length > 0 && (
            <div className="space-y-2 ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
              {replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default CommentItem

