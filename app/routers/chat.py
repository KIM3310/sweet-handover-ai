import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.search_service import search_documents
from app.services.openai_service import chat_with_context, analyze_files_for_handover
from app.utils.logging_utils import log_exception, safe_print

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list
    index_names: Optional[List[str]] = None

class AnalyzeRequest(BaseModel):
    messages: list
    index_names: Optional[List[str]] = None

@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    request_id = str(uuid.uuid4())
    try:
        # 프론트엔드에서 보낸 메시지 형식 처리
        messages = request.messages
        safe_print(f"🔍 /analyze 요청 수신 - messages 개수: {len(messages)}")

        # 사용자 메시지에서 파일 내용 추출
        user_message = next((m["content"] for m in messages if m["role"] == "user"), "")
        safe_print(f"📄 추출된 사용자 메시지 길이: {len(user_message)}")

        if len(user_message) == 0:
            safe_print("⚠️  빈 메시지 - 샘플 데이터로 응답")

        # OpenAI API를 호출하여 인수인계서 JSON 생성
        safe_print("🤖 OpenAI API 호출 시작...")
        response = analyze_files_for_handover(user_message, request.index_names)
        safe_print(f"✅ OpenAI 응답 완료 - 타입: {type(response)}")
        safe_print(f"   응답 샘플: {str(response)[:200]}")

        # 응답 검증
        if not isinstance(response, dict):
            safe_print(f"⚠️  응답이 dict가 아님: {type(response)} - 타입 변환 시도")
            if isinstance(response, str):
                try:
                    response = json.loads(response)
                except:
                    response = {"overview": {}, "jobStatus": {}}

        # 필수 필드 확인
        if "overview" not in response:
            safe_print("⚠️  overview 필드 없음 - 기본값 추가")
            response["overview"] = {"transferor": {}, "transferee": {}}

        safe_print(f"📤 최종 응답 필드: {list(response.keys())}")
        safe_print(f"📊 최종 응답 크기: {len(str(response))} 글자")

        return {
            "content": response,
            "request_id": request_id,
        }
    except Exception as e:
        log_exception("❌ Analyze error: ", e)
        raise HTTPException(status_code=500, detail=f"{e} (request_id={request_id})")

@router.post("/chat")
async def chat(request: ChatRequest):
    request_id = str(uuid.uuid4())
    try:
        # messages 배열에서 사용자 메시지 추출
        messages = request.messages
        user_message = next((m["content"] for m in messages if m["role"] == "user"), "")

        if not user_message:
            return {
                "content": "메시지를 입력해주세요.",
                "response": "메시지를 입력해주세요.",
                "request_id": request_id,
            }

        safe_print(f"💬 /chat 요청 수신 - 메시지: {user_message[:100]}")

        # 1. 관련 문서 검색
        search_results = search_documents(user_message, index_names=request.index_names)

        if not search_results:
            return {
                "content": "관련 문서를 찾을 수 없습니다. 먼저 문서를 업로드해주세요.",
                "response": "관련 문서를 찾을 수 없습니다. 먼저 문서를 업로드해주세요.",
                "request_id": request_id,
            }

        # 2. 컨텍스트 생성
        context = "\n\n".join([
            f"[{doc['file_name']}]\n{doc['content']}"
            for doc in search_results
        ])

        # 3. GPT로 답변 생성
        response = chat_with_context(user_message, context)
        safe_print(f"✅ 채팅 응답 완료 - {len(response)} 글자")

        return {
            "content": response,
            "response": response,
            "sources": [doc["file_name"] for doc in search_results],
            "request_id": request_id,
        }
    except Exception as e:
        log_exception("❌ Chat error: ", e)
        raise HTTPException(status_code=500, detail=f"{e} (request_id={request_id})")
