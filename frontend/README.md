# 🍯 꿀단지 (Sweet Handover AI) - Frontend

인수인계 문서 생성 AI 챗봇 프론트엔드입니다.

## 🚀 빠른 시작

### 1. 패키지 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 브라우저에서 접속
```
http://localhost:5173
```

---

## ⚙️ 백엔드 서버 연결 설정

**중요:** `services/geminiService.ts` 파일에서 백엔드 서버 주소를 설정해야 합니다.

```typescript
const CONFIG = {
  USE_LOCAL_BACKEND: true,
  // ⭐ 백엔드 서버 주소 (백엔드 개발자 IP로 변경하세요)
  LOCAL_BACKEND_URL: "http://59.22.78.84:8000",
  // ...
};
```

### 현재 백엔드 서버 정보
- **서버 주소**: `http://59.22.78.84:8000`
- **API 문서**: `http://59.22.78.84:8000/docs`
- **Health Check**: `http://59.22.78.84:8000/api/health`

---

## 📁 프로젝트 구조

```
frontend/
├── App.tsx              # 메인 앱 컴포넌트
├── index.tsx            # 엔트리 포인트
├── types.ts             # TypeScript 타입 정의
├── components/
│   ├── ChatWindow.tsx   # 채팅 인터페이스
│   ├── SourceSidebar.tsx # 자료 사이드바
│   ├── HandoverForm.tsx # 인수인계 폼
│   └── LoginScreen.tsx  # 로그인 화면
└── services/
    └── geminiService.ts # API 통신 서비스
```

---

## 🛠️ 문제 해결

### 백엔드 연결 안됨
1. 백엔드 서버가 실행 중인지 확인
2. `geminiService.ts`의 `LOCAL_BACKEND_URL` 주소가 올바른지 확인
3. 방화벽에서 8000번 포트가 열려있는지 확인

### CORS 에러
백엔드 서버의 CORS 설정을 확인하세요.
