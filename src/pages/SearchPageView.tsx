import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/useStore'
import Header from '@/components/Header'
import PostItem from '@/components/PostItem'

const SearchPageView = observer(() => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { searchStore } = useStore()

  useEffect(() => {
    if (query) {
      searchStore.search(query)
    } else {
      searchStore.clearSearch()
    }
  }, [query, searchStore])

  const handlePostClick = (postId: number, topicId: number) => {
    navigate(`/topic/${topicId}#post-${postId}`)
  }

  const handleTopicClick = (topicId: number) => {
    navigate(`/topic/${topicId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            검색 결과
          </h1>
          {query && (
            <p className="text-gray-600 dark:text-gray-400">
              "{query}" 검색 결과 - 주제 {searchStore.topics.length}개, 게시글 {searchStore.results.length}개
            </p>
          )}
        </div>

        {searchStore.isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {searchStore.errorMessage && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">
              {searchStore.errorMessage}
            </p>
          </div>
        )}

        {!searchStore.isLoading && !searchStore.errorMessage && searchStore.topics.length === 0 && searchStore.results.length === 0 && query && (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다
            </p>
          </div>
        )}

        {!searchStore.isLoading && !query && (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              검색어를 입력해주세요
            </p>
          </div>
        )}

        {!searchStore.isLoading && searchStore.topics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              주제 ({searchStore.topics.length})
            </h2>
            <div className="space-y-2">
              {searchStore.topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{topic.participants} 참여</span>
                      <span>{topic.posts} 게시글</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searchStore.isLoading && searchStore.results.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              게시글 ({searchStore.results.length})
            </h2>
            <div className="space-y-4">
              {searchStore.results.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id, post.topic_id)}
                  className="cursor-pointer"
                >
                  <PostItem post={post} topicId={post.topic_id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
})

export default SearchPageView

