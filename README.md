# md2cover

마크다운 문법으로 책 표지를 디자인하고 PDF로 내보내는 웹 애플리케이션.

---

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

---

## 화면 구성

헤더 1행에 모든 컨트롤이 집약된다.

```
[에디터 | 미리보기]  [제목 | 강조 | 흐림 | 배경 | 기타]  [B6↻]  [PDF]
──────────────────────────────────────────────────────────────────────
(툴탭 클릭 시 settings-row 토글 — 기본 접힘)
──────────────────────────────────────────────────────────────────────
에디터 패널 / 미리보기 패널 (한 번에 하나만 표시)
```

### 에디터 패널

CodeMirror 6 기반 마크다운 에디터. 구문 강조, 줄 번호, 자동 줄 바꿈 적용.

### 미리보기 패널

렌더링된 HTML을 `<iframe srcDoc>` 으로 표시. 실제 인쇄 크기(mm → CSS px)로 정확하게 렌더링된다. 입력이 멈춘 후 300ms debounce로 갱신.

---

## 툴바 설정

툴탭을 클릭하면 아래에 settings-row가 펼쳐진다. 같은 탭을 다시 누르면 접힌다.

### 제목 / 강조 / 흐림 / 배경 탭

각 텍스트 레이어(제목체·강조체·흐림체·배경체)에 대해 아래를 개별 설정한다.

| 항목 | 설명 |
|---|---|
| 폰트 | `public/fonts/bold/` 또는 `public/fonts/regular/` 에 있는 폰트 파일 선택. 목록은 `/api/fonts` 에서 동적으로 읽어 온다. 기본값은 Noto Sans. |
| 크기 | 숫자 입력 + 단위 선택 (`rem` / `px` / `pt`) |
| 색상 | hex 문자열 직접 입력 |

- **제목(heading)**: `# ` 으로 시작하는 줄. title 폰트 폴더 사용.
- **강조(bold)**: `**텍스트**` 인라인 마크업 및 code fence 블록 내 기본 텍스트. bold 폰트 폴더 사용.
- **흐림(regular)**: 일반 단락 `p`. regular 폰트 폴더 사용.
- **배경(bg)**: bg-* 블록의 텍스트. background font folder에서 선택.

### 기타 탭

| 항목 | 설명 |
|---|---|
| 행연결 / 행갈이 | 토글 버튼. `auto`(행 연결, 단락 내 줄바꿈을 공백으로 합침) / `manual`(행 갈이, `<br>` 삽입) |
| 배경색 | 표지 전체 배경색 (hex 문자열) |

### 크기 순환 버튼 (B6↻)

클릭할 때마다 `B6 → A5(국판) → MA5(신국판) → B6` 순으로 페이지 크기를 순환한다.

| 키 | 크기 |
|---|---|
| `b6` | 128 × 182 mm |
| `a5` | 148 × 210 mm |
| `ma5` | 153 × 225 mm |

### PDF 버튼

숨겨진 `<iframe>` 에 현재 HTML을 주입한 뒤 `contentWindow.print()` 를 호출한다. 브라우저의 인쇄 다이얼로그에서 "PDF로 저장"을 선택하면 된다.

---

## 마크다운 문법

### 기본 블록

```markdown
# 제목

일반 단락 텍스트. **볼드** 처리는 별표 두 개.

---
```

- `# 텍스트` → `<h1>` (제목 스타일)
- 텍스트 줄 → `<p>` (흐림 스타일). 연속된 줄은 `linebreak` 설정에 따라 공백 또는 `<br>` 로 합쳐진다.
- `**텍스트**` → `<strong>` (강조 스타일)
- `---` → `<hr>` 구분선

### 정렬 flow 블록

````markdown
```center
텍스트
여러 줄도 가능
```
````

지원 정렬: `left` · `center` · `right` · `justify`

줄바꿈을 강제하려면 `-br` 접미사를 붙인다.

````markdown
```center-br
줄 하나
줄 둘
```
````

`-br` 없이 `linebreak: manual` 설정이면 동일하게 `<br>` 처리.

### 절대 위치 블록

````markdown
```top-center
상단 가운데 고정 텍스트
```

```bottom-right
하단 우측 고정 텍스트
```
````

`(top|bottom)-(left|center|right|justify)` 조합. `position: absolute` 로 여백 기준 고정 배치된다.

### 세로 텍스트 블록

````markdown
```left-vertical
제목
```

```right-vertical
부제
```
````

텍스트를 한 글자씩 세로로 나열한다. 좌측 또는 우측 여백에 배치.

### 배경 블록

배경 블록은 `z-index: -1` 레이어에 렌더링된다. 한 문서에 하나만 권장 (복수 사용 시 경고 예정).

#### bg-big — 크게 하나

````markdown
```bg-big-{회전각}
텍스트
```
````

텍스트를 중앙에 크게 표시. 회전각은 도(degree) 단위 정수, 음수 가능.

```markdown
```bg-big--15
COVER
```
```

#### bg-repeat — 격자 반복

````markdown
```bg-repeat-{회전각}-{행간px}
텍스트
```
````

대각선 방향으로 텍스트를 격자 패턴으로 반복 배치. 행간은 px 단위 정수.

```markdown
```bg-repeat--20-40
글자
```
```

#### bg-continuous — 연속 흘림

````markdown
```bg-continuous-{회전각}-{행간px}
텍스트
```
````

텍스트를 `word-break: break-all` 기준으로 줄바꿈하며 연속 반복. 공백은 `·` 으로 치환되어 단어 단위가 아닌 문자 단위로 wrap된다. 회전 적용.

```markdown
```bg-continuous--10-32
흘러가는 배경 텍스트
```
```

#### bg-dummy — 텍스트 채우기

````markdown
```bg-dummy-{행간배수}
텍스트 블록 전체를 직접 작성
여러 줄 가능
```
````

지정한 `line-height` 배수로 텍스트를 배경에 그대로 표시. 더미 텍스트를 채울 때 사용.

---

## 폰트 설정

```
public/
  fonts/
    bold/      ← 강조체 후보 (ttf/otf/woff/woff2)
    regular/   ← 흐림체 후보
    background/  ← 배경체 후보
    title/  ← 제목체 후보
```

- 폰트 파일은 라이선스 문제로 `.gitignore` 처리 권장 (`public/fonts` 전체 제외됨).
- UI에서 업로드 기능은 없으며, 직접 파일을 해당 폴더에 넣어야 한다.
- 폰트를 선택하지 않으면 Noto Sans가 기본으로 적용된다.

---

## 프로젝트 구조

```
app/
  page.tsx          메인 페이지 (상태 관리, UI)
  layout.tsx        루트 레이아웃
  globals.css       전역 스타일
  api/fonts/
    route.ts        폰트 목록 API (GET /api/fonts)

components/
  Editor.tsx        CodeMirror 에디터 컴포넌트

lib/
  parser.ts         마크다운 → Block[] 파싱
  renderer.ts       Block[] → HTML 문자열 렌더링

public/
  fonts/
    bold/           볼드 폰트 파일
    regular/        레귤러 폰트 파일
```

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 에디터 | CodeMirror 6 |
| 파싱 | gray-matter (코드 펜스 파싱), 자체 구현 인라인 파서 |
| PDF | `window.print()` (브라우저 인쇄 API) |
| 스타일 | 글로벌 CSS (Tailwind 없음) |
| 런타임 요건 | Node.js ≥ 18.18, Termux(aarch64) 대응 |
