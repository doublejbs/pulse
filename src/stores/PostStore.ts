import { makeAutoObservable, runInAction } from 'mobx'
import { supabase } from '@/lib/supabase'

export interface Post {
  id: number
  topic_id: number
  content: string
  created_at?: string
  updated_at?: string
  comments_count?: number
  likes_count?: number
  is_liked?: boolean
}

export interface Comment {
  id: number
  post_id: number
  parent_comment_id?: number | null
  content: string
  created_at?: string
  updated_at?: string
  likes_count?: number
  is_liked?: boolean
  replies?: Comment[]
}

class PostStore {
  posts: Post[] = []
  comments: Record<number, Comment[]> = {} // post_id -> comments
  loading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async fetchPosts(topicId: number) {
    this.loading = true
    this.error = null

    try {
      // 게시글과 좋아요 수, 댓글 수를 함께 조회
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 각 게시글의 댓글 수와 좋아요 수 조회
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
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

      runInAction(() => {
        this.posts = postsWithCounts
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
      })
    }
  }

  async fetchComments(postId: number) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // 각 댓글의 좋아요 수와 좋아요 상태 조회
      const commentsWithCounts = await Promise.all(
        (data || []).map(async (comment: Comment) => {
          const [likesResult, isLikedResult] = await Promise.all([
            supabase
              .from('comment_likes')
              .select('id', { count: 'exact', head: true })
              .eq('comment_id', comment.id),
            user
              ? supabase
                  .from('comment_likes')
                  .select('id')
                  .eq('comment_id', comment.id)
                  .eq('user_id', user.id)
                  .limit(1)
              : Promise.resolve({ data: null }),
          ])

          return {
            ...comment,
            likes_count: likesResult.count || 0,
            is_liked: user ? (isLikedResult.data?.length || 0) > 0 : false,
            replies: [],
          }
        })
      )

      // 댓글에 replies 필드 추가
      const commentsWithReplies = commentsWithCounts

      // 댓글과 답글을 분리하여 계층 구조 생성
      const topLevelComments = commentsWithReplies.filter((c: Comment) => !c.parent_comment_id)
      const replies = commentsWithReplies.filter((c: Comment) => c.parent_comment_id)

      // 답글을 부모 댓글에 연결
      topLevelComments.forEach((comment: Comment) => {
        comment.replies = replies
          .filter((r: Comment) => r.parent_comment_id === comment.id)
          .sort((a: Comment, b: Comment) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
            return aTime - bTime
          })
      })

      runInAction(() => {
        this.comments[postId] = topLevelComments
      })
    } catch (error) {
      console.error('댓글 조회 실패:', error)
    }
  }

  async createComment(postId: number, content: string, parentCommentId?: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            parent_comment_id: parentCommentId || null,
            user_id: user.id,
            content,
          },
        ])

      if (error) throw error

      runInAction(() => {
        // 게시글의 댓글 수 업데이트 (답글이 아닌 경우만)
        if (!parentCommentId) {
          const post = this.posts.find((p) => p.id === postId)
          if (post) {
            post.comments_count = (post.comments_count || 0) + 1
          }
        }
      })
      
      // 댓글 목록 새로고침
      await this.fetchComments(postId)
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      throw error
    }
  }

  async toggleLike(postId: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 좋아요 토글
      const { data, error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_user_id: user.id,
      })

      if (error) throw error

      // 좋아요 상태 확인
      const { data: isLikedData } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .limit(1)

      runInAction(() => {
        const post = this.posts.find((p) => p.id === postId)
        if (post) {
          post.is_liked = (isLikedData?.length || 0) > 0
          post.likes_count = data || 0
        }
      })
    } catch (error) {
      console.error('좋아요 실패:', error)
      throw error
    }
  }

  async toggleCommentLike(commentId: number) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 댓글 좋아요 토글
      const { data, error } = await supabase.rpc('toggle_comment_like', {
        p_comment_id: commentId,
        p_user_id: user.id,
      })

      if (error) throw error

      // 좋아요 상태 확인
      const { data: isLikedData } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .limit(1)

      // 모든 게시글의 댓글에서 해당 댓글 찾아서 업데이트
      runInAction(() => {
        Object.keys(this.comments).forEach((postIdStr) => {
          const postId = Number(postIdStr)
          const updateComment = (comments: Comment[]): boolean => {
            for (const comment of comments) {
              if (comment.id === commentId) {
                comment.is_liked = (isLikedData?.length || 0) > 0
                comment.likes_count = data || 0
                return true
              }
              if (comment.replies && comment.replies.length > 0) {
                if (updateComment(comment.replies)) {
                  return true
                }
              }
            }
            return false
          }
          updateComment(this.comments[postId])
        })
      })
    } catch (error) {
      console.error('댓글 좋아요 실패:', error)
      throw error
    }
  }

  async createPost(topicId: number, content: string) {
    this.loading = true
    this.error = null

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            topic_id: topicId,
            user_id: user.id,
            content,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // 주제의 게시글 수 증가
      const { error: updateError } = await supabase.rpc('increment_topic_posts', {
        topic_id: topicId,
      })

      // RPC 함수가 없으면 직접 업데이트
      if (updateError) {
        const { data: topicData } = await supabase
          .from('topics')
          .select('posts')
          .eq('id', topicId)
          .single()

        if (topicData) {
          await supabase
            .from('topics')
            .update({ posts: (topicData.posts || 0) + 1 })
            .eq('id', topicId)
        }
      }

      runInAction(() => {
        if (data) {
          this.posts = [data, ...this.posts]
        }
        this.loading = false
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        this.loading = false
        throw error
      })
    }
  }
}

export default PostStore

