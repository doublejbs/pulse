import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/stores/useStore'
import type { Topic } from '@/stores/TopicStore'

const TopicItem = observer(({ topic }: { topic: Topic }) => {
  const navigate = useNavigate()

  const getTrendIcon = () => {
    switch (topic.trend) {
      case 'up':
        return (
          <span className="text-green-500 text-sm font-medium">↑</span>
        )
      case 'down':
        return (
          <span className="text-red-500 text-sm font-medium">↓</span>
        )
      default:
        return (
          <span className="text-gray-400 text-sm font-medium">-</span>
        )
    }
  }

  const handleClick = () => {
    navigate(`/topic/${topic.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors last:border-b-0 cursor-pointer"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm">
          {topic.rank}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">
            {topic.title}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>게시글 {topic.posts.toLocaleString()}개</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getTrendIcon()}
      </div>
    </div>
  )
})

const TopicList = observer(() => {
  const { topicStore } = useStore()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          실시간 pulse
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          지금 가장 활발한 주제들을 확인하세요
        </p>
      </div>
      <div>
        {topicStore.topics.map((topic) => (
          <TopicItem key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  )
})

export default TopicList

