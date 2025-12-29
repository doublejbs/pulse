import { observer } from 'mobx-react-lite'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import WritePostPage from '@/components/WritePostPage'
import PostItem from '@/components/PostItem'

const TopicBoardPage = observer(() => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { topicStore, postStore } = useStore()
  const [showWritePage, setShowWritePage] = useState(false)

  const topic = topicStore.topics.find((t) => t.id === Number(id))
  const topicId = id ? Number(id) : 0

  useEffect(() => {
    if (!topic && !topicStore.loading) {
      // 주제를 찾을 수 없으면 목록으로 이동
      navigate('/')
    }
  }, [topic, topicStore.loading, navigate])

  useEffect(() => {
    if (topicId) {
      postStore.fetchPosts(topicId)
    }
  }, [topicId, postStore])

  const handleWrite = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      setShowWritePage(true)
    } catch (error) {
      console.error('로그인 확인 실패:', error)
      navigate('/login')
    }
  }

  const handleSubmitPost = async (content: string) => {
    try {
      await postStore.createPost(topicId, content)
      // 게시글 목록 새로고침
      await postStore.fetchPosts(topicId)
      // 주제 목록도 새로고침 (게시글 수 업데이트)
      await topicStore.fetchTopics()
    } catch (error) {
      console.error('게시글 작성 실패:', error)
      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
        navigate('/login')
      } else {
        alert('게시글 작성에 실패했습니다. 다시 시도해주세요.')
      }
      throw error
    }
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">주제를 찾을 수 없습니다.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {showWritePage ? (
        <WritePostPage
          onClose={() => setShowWritePage(false)}
          onSubmit={handleSubmitPost}
        />
      ) : (
        <>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
              >
                ← 목록으로
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {topic.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>참여자 {topic.participants.toLocaleString()}명</span>
                <span>게시글 {topic.posts.toLocaleString()}개</span>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
              {postStore.loading ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                  로딩 중...
                </p>
              ) : postStore.posts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                  아직 게시글이 없습니다. 첫 게시글을 작성해보세요!
                </p>
              ) : (
                <div className="space-y-0">
                  {postStore.posts.map((post) => (
                    <PostItem key={post.id} post={post} topicId={topicId} />
                  ))}
                </div>
              )}
            </div>
          </main>
          <button
            onClick={handleWrite}
            className="fixed bottom-6 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full font-medium shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-900/20 dark:focus:ring-white/20 z-50"
          >
            작성하기
          </button>
        </>
      )}
    </div>
  )
})

export default TopicBoardPage

