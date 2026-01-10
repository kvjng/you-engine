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

examples/              # 예제 프로젝트
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
