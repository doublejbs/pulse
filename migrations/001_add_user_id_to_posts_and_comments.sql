-- 마이그레이션: posts와 comments 테이블에 user_id 추가
-- 실행 날짜: 2024-12-29
-- 설명: 게시글과 댓글 작성 시 로그인 사용자 정보 저장

-- posts 테이블에 user_id 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- comments 테이블에 user_id 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- 기존 데이터가 있다면 NULL로 유지 (선택사항)
-- 필요시 기존 데이터를 특정 사용자에게 할당하거나 삭제할 수 있습니다

