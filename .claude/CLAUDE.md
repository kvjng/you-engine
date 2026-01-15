# You-Engine

웹 기반 2D 게임 엔진. 순수 JavaScript(ES6 모듈)로 작성됨.

## 빌드 및 실행

- 빌드 시스템 없음 (번들러, TypeScript 없음)
- HTML에서 `type="module"` 스크립트로 직접 실행
- 예제 실행: `examples/` 폴더의 HTML 파일을 브라우저에서 열기

## 프로젝트 구조

```
you/                    # 엔진 코어
├── you.js             # 메인 엔트리 (You.run() 내보냄)
├── engine.js          # 엔진 클래스 (시스템 초기화)
├── application.js     # Application, SceneApplication 베이스 클래스
├── scene.js           # 씬 관리 및 라이프사이클
├── object.js          # 컴포넌트/자식 객체를 가진 게임 오브젝트
├── component.js       # 오브젝트용 컴포넌트 시스템
├── camera.js          # 줌/팬 지원 카메라
├── screen.js          # 캔버스 스크린 래퍼
├── asset.js           # LocalStorage 기반 에셋 저장소
├── resource.js        # 리소스 로더
├── framework/         # 코어 프레임워크 (loop, input, output, event)
├── graphics/          # 렌더링 (image, sprite, label)
├── math/              # 벡터, 지오메트리, 랜덤 유틸리티
├── ui/                # UI 시스템 (view)
└── utilities/         # 공유 유틸리티 (event emitter, resource parser)

examples/              # 별도 git repo로 관리 (이 프로젝트에서 수정하지 않음)
```

## 핵심 아키텍처

### 객체 계층
```
Object → Loopable → Enable → Stateful
```

### 라이프사이클 상태
`INSTANTIATED → CREATED → DESTROYING → DESTROYED`

### 주요 시스템
- **Engine**: 모든 서브시스템 관리
- **Application/SceneApplication**: 앱 베이스 클래스, 씬 스택 관리
- **Scene**: 게임 오브젝트 컨테이너, 카메라 관리
- **Object**: 컴포넌트와 자식 오브젝트를 가진 게임 오브젝트
- **Component**: update/render 라이프사이클을 가진 컴포넌트

### 게임 루프
requestAnimationFrame 기반, 매 프레임 update() → render() 호출

### 리소스 로딩 문법
```javascript
'@path/to/file.json'        // JSON 로드
'image@path/to/image.png'   // 이미지 로드
'sprite@path/to/sprite.json' // 스프라이트 로드
{ '@class': ClassName, ... } // 클래스 인스턴스화
```

## 엔진 사용법

```javascript
import { You } from './you/you.js'

You.run({
  screens: {
    main: { canvas: document.querySelector('canvas'), size: [800, 600] }
  },
  applications: [new MyApplication()]
})
```

## 코드 스타일

- 순수 ES6 모듈 (import/export)
- 클래스 기반 OOP
- EventEmitter 패턴 (pub/sub)
- Array 프로토타입 확장으로 벡터 연산

## 개발 방식

### 브랜치 전략
- **기본 브랜치**: `develop` (최신 상태 유지)
- **피처 브랜치**: 작업별로 `develop`에서 분기하여 생성
- **Merge**: 일반 merge 사용 (히스토리 보존)
- **머지 위치**: fork된 kvjng 브랜치에서 머지 (origin)
- **작업 흐름**:
  1. `develop` 브랜치를 최신 상태로 유지
  2. `develop`에서 `feature/<작업명>` 브랜치 생성
  3. 피처 브랜치에서 작업 및 커밋
  4. 완료 후 `develop`으로 머지
- **세션 독립성**: 여러 세션에서 작업할 수 있으므로, 항상 `develop`을 기준으로 새 브랜치 생성

### Pull Request
- **PR 생성 시 base 브랜치**: 반드시 `develop` (main이 아님)
- **PR 생성 명령어**: `gh pr create --base develop`
- **혼합 방식** - 중요한 변경은 PR, 작은 변경은 대화에서 리뷰
- **PR 기준**: API 변경, 핵심 로직 변경

### 커밋 메시지
- **Conventional Commits** 형식 사용
- 접두사: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` 등
- 언어: 한국어

### 테스트
- **프레임워크**: Vitest
- **범위**: 단위 테스트
- **커버리지 목표**: 80% 이상

### 버전 관리
- **Semantic Versioning** (MAJOR.MINOR.PATCH)
- **현재 상태**: 0.x.x (초기 개발 단계)
- **패키지 매니저**: pnpm

### 변경 이력 문서화
- **위치**: `docs/history/` 하위에 건별 파일로 관리
- **파일명**: `YYYY-MM-DD-<주제>.md`
- **내용**: 날짜, 작업자, 변경 사항 (버그 수정, 기능 추가, 구조 개선 등)
- **작성 시점**: 브랜치 머지 전 또는 주요 작업 완료 시

### 구현 계획 문서 관리
- **위치**: `docs/plans/`
- **파일명**: `YYYY-MM-DD-<feature-name>.md`
- **폴더 구조**:
  - `docs/plans/*.md` - 활성 계획 (대기 중 또는 진행 중)
  - `docs/plans/archived/` - 구현 완료된 계획
  - `docs/plans/deprecated/` - 폐기된 계획 (기획 변경 시, 삭제하지 않고 보관)
- **이동 시점**:
  - 구현 완료 시 → `archived/`로 이동
  - 기획 변경으로 폐기 시 → `deprecated/`로 이동
