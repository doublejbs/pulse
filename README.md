# Pulse

React + MobX + TypeScript + Vite + Supabase 프로젝트

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. Supabase 데이터베이스 설정

#### 초기 스키마 설정

1. [Supabase Dashboard](https://app.supabase.com)에 접속하여 프로젝트를 선택합니다.
2. 왼쪽 메뉴에서 **"SQL Editor"**를 클릭합니다.
3. **"New query"** 버튼을 클릭합니다.
4. `supabase-schema.sql` 파일의 전체 내용을 복사하여 붙여넣습니다.
5. **"Run"** 버튼을 클릭하거나 `Cmd/Ctrl + Enter`를 눌러 실행합니다.

#### 마이그레이션 실행 (기존 데이터베이스가 있는 경우)

기존 데이터베이스에 컬럼을 추가하거나 변경이 필요한 경우 `migrations/` 폴더의 마이그레이션 파일을 실행하세요:

1. SQL Editor에서 **"New query"** 클릭
2. `migrations/001_add_user_id_to_posts_and_comments.sql` 파일 내용 복사하여 붙여넣기
3. **"Run"** 버튼 클릭

#### 주의사항

- Supabase Auth가 활성화되어 있어야 합니다 (게시글, 댓글, 좋아요 기능에 필요).
- 전체 스크립트를 한 번에 실행하거나, 테이블/함수별로 나눠서 실행할 수 있습니다.
- `CREATE TABLE IF NOT EXISTS` 구문으로 중복 생성은 방지됩니다.
- 마이그레이션 파일은 순서대로 실행하세요.

### 3. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 Supabase 설정을 추가하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase 프로젝트의 URL과 Anon Key는 [Supabase Dashboard](https://app.supabase.com)의 Settings > API에서 확인할 수 있습니다.

### 4. 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

### 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
src/
  ├── lib/            # 라이브러리 설정
  │   └── supabase.ts # Supabase 클라이언트
  ├── stores/         # MobX stores
  │   ├── CounterStore.ts
  │   ├── ExampleStore.ts  # Supabase 연동 예제
  │   ├── RootStore.ts
  │   └── useStore.tsx
  ├── App.tsx         # 메인 앱 컴포넌트
  ├── main.tsx        # 엔트리 포인트
  └── index.css       # 글로벌 스타일
```

## 기술 스택

- React 18
- MobX 6
- TypeScript
- Vite
- Tailwind CSS
- Supabase

## Supabase 사용법

### Store에서 Supabase 사용하기

`ExampleStore.ts`를 참고하여 Supabase와 연동된 MobX store를 만들 수 있습니다:

```typescript
import { supabase } from '@/lib/supabase'

// 데이터 조회
const { data, error } = await supabase
  .from('table_name')
  .select('*')

// 데이터 생성
const { data, error } = await supabase
  .from('table_name')
  .insert([{ column: 'value' }])

// 데이터 수정
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', id)

// 데이터 삭제
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id)
```

### 실시간 구독 (Realtime)

Supabase의 실시간 기능을 사용하려면 `ExampleStore.ts`에 구독 로직을 추가할 수 있습니다:

```typescript
supabase
  .channel('table_name')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'table_name' },
    (payload) => {
      // 데이터 업데이트 처리
    }
  )
  .subscribe()
```
