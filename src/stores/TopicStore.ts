import { makeAutoObservable, runInAction } from 'mobx'
import { supabase } from '@/lib/supabase'

export interface Topic {
  id: number
  rank?: number
  title: string
  participants: number
  posts: number
  trend: 'up' | 'down' | 'same'
  created_at?: string
}

class TopicStore {
  topics: Topic[] = []
  loading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
    this.fetchTopics()
  }

  async fetchTopics() {
    this.loading = true
    this.error = null

    try {
      // 최근 30분간 게시글 수로 정렬
      const { data, error } = await supabase.rpc('get_topics_by_recent_posts', {
        minutes: 30,
        limit_count: 10,
      })

      if (error) throw error

      runInAction(() => {
        this.topics = (data || []).map((topic: Topic, index: number) => ({
          ...topic,
          rank: index + 1,
        }))
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }

  async createTopic(title: string) {
    this.loading = true
    this.error = null

    try {
      const { error } = await supabase
        .from('topics')
        .insert([
          {
            title,
            participants: 0,
            posts: 0,
            trend: 'same',
          },
        ])

      if (error) throw error

      runInAction(() => {
        this.loading = false
      })
      
      // 주제 목록 새로고침
      await this.fetchTopics()
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
        throw error
      })
    }
  }
}

export default TopicStore

