import { observer } from 'mobx-react-lite'
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/stores/PostStore'
import CommentItem from './CommentItem'

interface PostItemProps {
  post: Post
  topicId: number
}

const PostItem = observer(({ post }: PostItemProps) => {
  const { postStore } = useStore()
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }

    getCurrentUser()
  }, [])

  const comments = postStore.comments[post.id] || []

  const handleToggleLike = async () => {
    try {
      await postStore.toggleLike(post.id)
    } catch (error) {
      console.error('좋아요 실패:', error)
      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
        navigate('/login')
      }
    }
  }

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      postStore.fetchComments(post.id)
    }
    setShowComments(!showComments)
  }

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      await postStore.createComment(post.id, commentContent.trim())
      setCommentContent('')
      if (!showComments) {
        setShowComments(true)
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
        navigate('/login')
      } else if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('댓글 작성에 실패했습니다.')
      }
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const isMyPost = currentUserId && post.user_id === currentUserId

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-start gap-2 mb-3">
        {isMyPost && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded">
            내가 쓴글
          </span>
        )}
      </div>
      <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
        {post.content}
      </p>
      {post.created_at && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          {new Date(post.created_at).toLocaleString('ko-KR')}
        </p>
      )}
      
      {/* 좋아요 및 댓글 버튼 */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${
            post.is_liked
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
          }`}
        >
          <span className="text-lg">{post.is_liked ? '❤️' : '🤍'}</span>
          <span>{post.likes_count || 0}</span>
        </button>
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <span>💬</span>
          <span>{post.comments_count || 0}</span>
        </button>
      </div>

      {/* 댓글 섹션 */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          {/* 댓글 입력 */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full p-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-white/20"
              rows={2}
            />
            <button
              type="submit"
              disabled={!commentContent.trim() || isSubmittingComment}
              className="mt-2 px-4 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? '작성 중...' : '댓글 작성'}
            </button>
          </form>

          {/* 댓글 목록 */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                댓글이 없습니다.
              </p>
            ) : (
              comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  postId={post.id}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default PostItem

