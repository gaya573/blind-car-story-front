# 블라인드 카스토리 (blind-car-story-front)

원더 제휴사 프론트엔드입니다. 원본 리액트(`wonder-front-user`)를 복제해 퍼블리싱과 API 연동을 그대로 가져오고, 브랜딩(사명·로고·색상·SNS)만 블라인드 카스토리로 교체했습니다.

API 호출 코드는 원본과 동일하게 유지했습니다.

## 기술 스택

원본과 같습니다. React 19, Vite 7, React Router 7, TanStack Query 5, Axios, react-helmet, Jest.

## 실행

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`는 카카오 키 용도로만 복사하면 됩니다. API 주소는 아래 프록시 설정이 처리합니다.

### 로컬 CORS 처리 (개발 프록시)

운영 API 서버는 CORS 허용 도메인 목록에 있는 오리진만 받고, `security.cors.allow-insecure-origins=false`라서 `http://`로 시작하는 오리진은 전부 거부합니다. 브라우저가 `localhost:5173`에서 `https://api.wonder.p-e.kr`을 직접 부르면 무조건 403입니다.

그래서 개발 서버가 대신 호출하도록 프록시를 넣었습니다.

- `vite.config.js`의 `server.proxy['/api']`가 요청을 백엔드로 넘기면서 `Origin`·`Referer` 헤더를 제거합니다. 브라우저가 아닌 서버 간 호출이 되므로 CORS 검사 자체가 발생하지 않습니다.
- `.env.development`의 `VITE_API_BASE_URL=/`이 프론트 요청을 같은 오리진(`localhost:5173/api/...`)으로 보내 프록시를 타게 합니다.

`npm run dev`만 실행하면 별도 설정 없이 실데이터가 들어옵니다. 운영 빌드는 `.env.development`를 읽지 않으므로 기존처럼 `https://api.wonder.p-e.kr`을 직접 호출합니다.

로컬 백엔드를 띄웠다면 `.env.development`의 `VITE_API_PROXY_TARGET`을 `http://localhost:8080`으로 바꿉니다.

참고로 `/api/user/cars`는 운영 서버 응답이 20초 이상 걸립니다. 첫 화면 로딩이 느린 건 프록시 문제가 아니라 백엔드 응답 시간입니다.

## npm 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 로컬 확인 |
| `npm run lint` | ESLint 검사 |
| `npm test` | Jest 테스트 |
| `npm run deploy` | `dist`를 S3에 업로드하고 CloudFront 캐시 무효화 |

`npm run lint`는 원본에서 물려받은 오류 620건(477 error, 143 warning)이 그대로 나옵니다. 원본 프로젝트에서도 동일하며 CI 게이트로 쓰지 않습니다.

## 복제·브랜딩 재현 스크립트

브랜딩 교체를 다시 수행하거나 원본 변경분을 다시 가져올 때 씁니다. 모두 원본 폴더를 읽기만 합니다.

| 스크립트 | 역할 |
|---|---|
| `scripts/clone-original.mjs` | 원본 `src`, `public`, 설정 파일을 이 프로젝트로 복제 |
| `scripts/scan-branding.mjs` | 원본에 박힌 브랜딩 문자열 위치 조사 |
| `scripts/apply-branding.mjs` | 사명·SNS·로고 경로 치환 (테스트 파일 제외) |
| `scripts/recolor-blue-to-gold.mjs` | 1단계. 파란 계열 색상을 골드로 회전 (`--report`로 미리보기) |
| `scripts/recolor-gold-to-black.mjs` | 2단계. 1단계 결과를 시안 팔레트로 다시 매핑 (`--report`로 변환표 확인) |
| `scripts/import-brand-logo.mjs` | 시안 로고를 `public/logo`로 복사 |

복제부터 다시 하려면 순서대로 실행합니다. 색상 스크립트는 **반드시 두 개를 연달아** 실행해야 합니다. 1단계만 돌리면 아래 "색상 기준"에 적은 문제가 그대로 남습니다.

```bash
node scripts/clone-original.mjs
node scripts/import-brand-logo.mjs
node scripts/apply-branding.mjs
node scripts/recolor-blue-to-gold.mjs
node scripts/recolor-gold-to-black.mjs
```

단, 복제는 `src`와 `public`을 덮어쓰므로 이후 손으로 고친 부분(푸터 사업자 정보, `index.html`, `StructuredData.jsx`, 색상 토큰)은 다시 적용해야 합니다.

## 브랜딩 기준값

모두 Blind Car Story 시안에서 확인한 값이며 임의로 만든 값은 없습니다.

| 항목 | 값 |
|---|---|
| 사명 | 블라인드 카스토리 / Blind CarStory |
| 전화 | 1577-8319 |
| 유튜브 | https://www.youtube.com/@BlindCarstory |
| 로고 | `/logo/carstory-logo.svg` |
| 주소·대표·사업자등록번호·이메일 | 정보 준비중 (시안도 미확정) |

## 색상 기준

시안 `assets/css/tokens.css`를 그대로 따릅니다. **주색은 검정이고 골드는 강조용입니다.**

| 용도 | 값 | 쓰는 곳 |
|---|---|---|
| 주색 | `#111111` | CTA 버튼, 채워진 배지, 활성 칩, 어두운 면 |
| 주색 hover | `#2A2A2A` | 시안은 주색보다 밝게 처리 |
| 주색 pressed | `#000000` | |
| 골드 | `#C9A227` | 배지, 아이콘, 탭 밑줄 |
| 골드 진하게 | `#A78416` | 가격·강조 문구 |
| 골드 연하게 | `#F6EFD8` | 칩·배지 배경 |
| 골드 라인 | `#E8D79A` | 칩 테두리 |
| 경고 | `#D61F26` | 마감 임박 등 |

색상 스크립트를 두 단계로 나눠 둔 이유는 1단계(`recolor-blue-to-gold.mjs`)에 다음 두 문제가 있어서입니다. 2단계(`recolor-gold-to-black.mjs`)가 원본 값을 다시 계산해 바로잡습니다.

- 1단계는 hue 195~265를 전부 골드로 돌립니다. 그래서 **주색이 검정이 아니라 골드**가 됩니다.
- 파란 기운이 살짝 있는 중립 회색(`#6b7280`, `#111827`, `#0f172a` 등 100건 이상)까지 골드가 되어 본문 글자와 어두운 면이 탁한 겨자색으로 바뀝니다.

2단계는 원본 값의 채도와 지각밝기(L\*)로 역할을 판정합니다. 채도가 높으면 브랜드 파랑이었다고 보고 검정 계열로, 채도가 낮으면 중립 회색이었다고 보고 같은 밝기의 무채색으로 되돌립니다. 연한 파란 배경·테두리만 연한 골드로 보냅니다.

차량 외장색 표(`CarDetail.jsx`, `CarLineDetail.jsx`, `CarTrimDetail.jsx`, `MobleCarDetail.jsx`)는 "인텐스 블루", "네이비" 같은 실제 도장색이라 색상 변환 대상이 아닙니다. 2단계에서 원본 값으로 되돌립니다.

## 데이터 처리

원본과 동일한 공용 API를 사용합니다. 확인된 정상 동작 엔드포인트는 다음과 같습니다.

- `GET /api/content/main-page/closing-soon` — 마감 임박
- `GET /api/content/pre-purchase` — 재고 특가 핫딜
- `GET /api/content/express-deals` — 재고 특가 목록
- `GET /api/content/main-page/reviews` — 출고 후기
- `GET /api/user/cars/brands`, `GET /api/user/cars/v3` — 브랜드·차량 목록

제휴사 전용 콘텐츠(`GET /api/coalition/{code}/contents`)는 어드민에 제휴사가 등록되어야 응답합니다. 미등록 상태에서는 `400 존재하지 않는 제휴사`가 반환됩니다.

## 원더 어드민 연동

어드민 코드는 수정하지 않았습니다. 기존 제휴사 등록 폼을 그대로 사용합니다.

1. 원더 어드민에 `CEO` 또는 `ADMIN` 권한으로 로그인 (그 아래 권한에는 등록 버튼이 보이지 않습니다)
2. **제휴사 관리** → `+ 제휴사 등록`
3. 코드·명칭 입력 후 `활성` 체크

등록한 코드는 이 프로젝트에서 제휴사 API를 호출할 때 쓰는 코드와 일치해야 합니다.

## 배포

### GitHub Actions

`main` 또는 `master`에 푸시하면 `.github/workflows/deploy.yml`이 설치 → 서버 시각 경계 테스트 → 빌드 → S3 업로드 → CloudFront 무효화를 실행합니다.

| 종류 | 이름 | 예시 |
|---|---|---|
| Secret | `AWS_ACCESS_KEY_ID` | |
| Secret | `AWS_SECRET_ACCESS_KEY` | |
| Variable | `S3_BUCKET` | `blind-car-story-front` |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | `E...` |
| Variable | `AWS_REGION` | `ap-northeast-2` |
| Variable | `VITE_API_BASE_URL` | `https://api.wonder.p-e.kr` |

### 로컬 배포

```bash
npm run predeploy
$env:S3_BUCKET="버킷명"
$env:CLOUDFRONT_DISTRIBUTION_ID="배포ID"
npm run deploy
```

자격 증명 없이 실행할 명령만 확인하려면 `node scripts/deploy-s3.mjs --dry-run`을 쓰세요.

### CloudFront 설정 (SPA 필수)

클라이언트 라우팅을 쓰므로 `/carlist/domestic` 같은 경로로 직접 접속하면 S3에서 404가 납니다. CloudFront 배포의 **Error pages**에 아래 두 규칙을 추가해야 합니다.

| HTTP error code | Response page path | HTTP response code |
|---|---|---|
| 403 | `/index.html` | 200 |
| 404 | `/index.html` | 200 |

## 도메인 확정 후 해야 할 일

배포 도메인이 정해지면 다음을 채워야 합니다.

- 백엔드 `application-prod.properties`의 `spring.web.cors.allowed-origins`에 도메인 추가 (이게 없으면 브라우저에서 데이터를 못 받습니다)
- `public/robots.txt`에 `Sitemap:` 줄 추가
- `public/sitemap.xml` 새로 생성 (원본 도메인이 박혀 있어 삭제했습니다)
- `index.html`에 `canonical`, `og:url`, `og:image` 추가

`StructuredData.jsx`는 실행 중인 주소를 쓰도록 바꿨으니 별도 수정이 필요 없습니다.

## 확정된 결정

- **외부 추적을 쓰지 않습니다.** 원본의 Google Tag Manager(`GTM-M6HDSTWD`), Meta Pixel(`1460454072264975`), 네이버 사이트 소유확인 토큰은 원더굿라이프 계정이라 제거했고 다시 넣지 않습니다. 방문·상담 지표는 어드민 **제휴사 관리 → 분석**에서 자체 로그(`POST /api/coalition/BLINDCAR/analytics/log`)로 봅니다.
- **카카오 상담 채널은 원더굿라이프 채널을 그대로 씁니다.** 제휴사에 `kakaoChannelPublicId`를 비워 두면 백엔드가 기본 채널(`_TIYxaC`)로 보냅니다. 상담 기록 자체는 `coalition_consult`에 BLINDCAR로 분리되어 쌓입니다.
- **디자인은 원본과 동일하게 둡니다.** 시안으로 맞춘 것은 색상(주색 검정 + 골드 강조)과 배너·유튜브 콘텐츠뿐이고, 일러스트와 레이아웃은 원더굿라이프 그대로입니다.

## 아직 남은 항목

- **펭귄 마스코트**: 원본 디자인은 펭귄 일러스트를 19개 파일에서 사용합니다. 원더굿라이프 마스코트이지만 디자인 동일 유지 방침에 따라 그대로 두었습니다.
- **`public/mobileMain/유튜브_링크.svg`**: 원본 채널명이 벡터로 박혀 있습니다. 이 파일을 쓰는 `YoutubeSection`은 현재 렌더링되지 않는 죽은 코드라 화면에는 나오지 않습니다.
