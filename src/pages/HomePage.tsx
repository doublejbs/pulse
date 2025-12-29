import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import TopicList from '@/components/TopicList'
import CreatePulseButton from '@/components/CreatePulseButton'
import CreatePulsePage from '@/components/CreatePulsePage'
import { useStore } from '@/stores/useStore'
import { supabase } from '@/lib/supabase'

const HomePage = observer(() => {
  const { topicStore } = useStore()
  const navigate = useNavigate()
  const [showCreatePage, setShowCreatePage] = useState(false)

  const handleCreatePulse = async (content: string) => {
    try {
      await topicStore.createTopic(content)
      // 성공 후 주제 목록 새로고침
      await topicStore.fetchTopics()
    } catch (error) {
      console.error('주제 생성 실패:', error)
      if (error instanceof Error && error.message === '로그인이 필요합니다.') {
        navigate('/login')
      } else {
        alert('주제 생성에 실패했습니다. 다시 시도해주세요.')
      }
      throw error
    }
  }

  const handleCreatePulseClick = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      setShowCreatePage(true)
    } catch (error) {
      console.error('로그인 확인 실패:', error)
      navigate('/login')
    }
  }

  return (
    <>
      {showCreatePage ? (
        <CreatePulsePage
          onClose={() => setShowCreatePage(false)}
          onSubmit={handleCreatePulse}
        />
      ) : (
        <>
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TopicList />
          </main>
          <CreatePulseButton onClick={handleCreatePulseClick} />
        </>
      )}
    </>
  )
})

export default HomePage

