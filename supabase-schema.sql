-- topics 테이블 생성
CREATE TABLE IF NOT EXISTS topics (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  participants INTEGER DEFAULT 0,
  posts INTEGER DEFAULT 0,
  trend TEXT DEFAULT 'same' CHECK (trend IN ('up', 'down', 'same')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_topics_participants ON topics(participants DESC);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정 (필요시)
-- ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (필요시)
-- CREATE POLICY "Anyone can read topics" ON topics FOR SELECT USING (true);

-- 인증된 사용자만 생성 가능 (필요시)
-- CREATE POLICY "Authenticated users can create topics" ON topics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- posts 테이블 생성
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- updated_at 트리거 생성
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 주제의 게시글 수를 증가시키는 함수
CREATE OR REPLACE FUNCTION increment_topic_posts(topic_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE topics
  SET posts = posts + 1
  WHERE id = topic_id;
END;
$$ LANGUAGE plpgsql;

-- 최근 30분간 게시글 수로 주제를 정렬하는 함수
CREATE OR REPLACE FUNCTION get_topics_by_recent_posts(minutes INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  participants INTEGER,
  posts INTEGER,
  trend TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  recent_posts_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.participants,
    t.posts,
    t.trend,
    t.created_at,
    t.updated_at,
    COALESCE(COUNT(p.id), 0)::BIGINT as recent_posts_count
  FROM topics t
  LEFT JOIN posts p ON p.topic_id = t.id 
    AND p.created_at >= NOW() - (minutes || ' minutes')::INTERVAL
  GROUP BY t.id, t.title, t.participants, t.posts, t.trend, t.created_at, t.updated_at
  ORDER BY recent_posts_count DESC, t.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- comments 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- updated_at 트리거 생성
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- likes 테이블 생성 (user_id 포함)
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 게시글의 좋아요를 토글하는 함수
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id BIGINT, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  like_exists BOOLEAN;
  like_count INTEGER;
BEGIN
  -- 좋아요가 이미 있는지 확인
  SELECT EXISTS(SELECT 1 FROM likes WHERE post_id = p_post_id AND user_id = p_user_id) INTO like_exists;
  
  IF like_exists THEN
    -- 좋아요 취소
    DELETE FROM likes WHERE post_id = p_post_id AND user_id = p_user_id;
  ELSE
    -- 좋아요 추가
    INSERT INTO likes (post_id, user_id) VALUES (p_post_id, p_user_id);
  END IF;
  
  -- 현재 좋아요 수 반환
  SELECT COUNT(*) INTO like_count FROM likes WHERE post_id = p_post_id;
  RETURN like_count;
END;
$$ LANGUAGE plpgsql;

-- comment_likes 테이블 생성 (user_id 포함)
CREATE TABLE IF NOT EXISTS comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- 댓글의 좋아요를 토글하는 함수
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id BIGINT, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  like_exists BOOLEAN;
  like_count INTEGER;
BEGIN
  -- 좋아요가 이미 있는지 확인
  SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = p_comment_id AND user_id = p_user_id) INTO like_exists;
  
  IF like_exists THEN
    -- 좋아요 취소
    DELETE FROM comment_likes WHERE comment_id = p_comment_id AND user_id = p_user_id;
  ELSE
    -- 좋아요 추가
    INSERT INTO comment_likes (comment_id, user_id) VALUES (p_comment_id, p_user_id);
  END IF;
  
  -- 현재 좋아요 수 반환
  SELECT COUNT(*) INTO like_count FROM comment_likes WHERE comment_id = p_comment_id;
  RETURN like_count;
END;
$$ LANGUAGE plpgsql;

