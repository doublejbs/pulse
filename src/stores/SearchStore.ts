import { makeAutoObservable, runInAction } from 'mobx'
import { supabase } from '@/lib/supabase'
import { Post } from './PostStore'
import { Topic } from './TopicStore'

class SearchStore {
  private searchResults: Post[] = []
  private topicResults: Topic[] = []
  private searchQuery: string = ''
  private loading: boolean = false
  private error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  public get results(): Post[] {
    return this.searchResults
  }

  public get topics(): Topic[] {
    return this.topicResults
  }

  public get query(): string {
    return this.searchQuery
  }

  public get isLoading(): boolean {
    return this.loading
  }

  public get errorMessage(): string | null {
    return this.error
  }

  public async search(query: string): Promise<void> {
    if (!query.trim()) {
      runInAction(() => {
        this.searchResults = []
        this.topicResults = []
        this.searchQuery = ''
      })
      return
    }

    this.loading = true
    this.error = null
    this.searchQuery = query

    try {
      console.log('검색 시작:', query)
      
      // 1. 게시글 내용으로 검색
      const { data: contentPosts, error: contentError } = await supabase
        .from('posts')
        .select('*')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (contentError) throw contentError

      // 2. 주제 이름으로 검색
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (topicsError) throw topicsError

      console.log('주제 검색 결과:', topicsData)
      console.log('게시글 검색 결과:', contentPosts)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 3. 좋아요, 댓글 수 등 추가 정보 가져오기
      const postsWithCounts = await Promise.all(
        (contentPosts || []).map(async (post) => {
          const [commentsResult, likesResult, isLikedResult] = await Promise.all([
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('likes')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            user
              ? supabase
                  .from('likes')
                  .select('id')
                  .eq('post_id', post.id)
                  .eq('user_id', user.id)
                  .limit(1)
              : Promise.resolve({ data: null }),
          ])

          return {
            ...post,
            comments_count: commentsResult.count || 0,
            likes_count: likesResult.count || 0,
            is_liked: user ? (isLikedResult.data?.length || 0) > 0 : false,
          }
        })
      )

      console.log('최종 검색 결과 - 주제:', topicsData, '게시글:', postsWithCounts)

      runInAction(() => {
        this.topicResults = topicsData || []
        this.searchResults = postsWithCounts
        this.loading = false
      })
    } catch (error) {
      console.error('검색 에러:', error)
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }

  public clearSearch(): void {
    runInAction(() => {
      this.searchResults = []
      this.topicResults = []
      this.searchQuery = ''
      this.error = null
    })
  }
}

export default SearchStore

