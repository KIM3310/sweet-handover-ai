from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import upload, chat
from app.config import validate_config
import os

# 환경 변수 검증
is_config_valid = validate_config()
if not is_config_valid:
    print("⚠️  Warning: Some environment variables are missing. Some features may not work correctly.")

app = FastAPI(title="RAG Chatbot API")

# CORS 미들웨어 설정 (가장 먼저 추가)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://192.168.200.115:5173",
        "http://192.168.200.115:5174",
        "*"  # 개발 단계에서는 모든 오리진 허용
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Frontend 경로
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

@app.get("/")
def root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])

# Health check endpoint
@app.get("/api/health")
def health_check():
    return {"status": "ok", "config_valid": is_config_valid}

@app.get("/test")
def test():
    return {"message": "Backend is working!"}