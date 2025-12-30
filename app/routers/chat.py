from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.search_service import search_documents
from app.services.openai_service import chat_with_context, analyze_files_for_handover
import json
import traceback

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list

class AnalyzeRequest(BaseModel):
    messages: list

@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        # 프론트엔드에서 보낸 메시지 형식 처리
        messages = request.messages
        print(f"🔍 /analyze 요청 수신 - messages 개수: {len(messages)}")
        
        # 사용자 메시지에서 파일 내용 추출
        user_message = next((m["content"] for m in messages if m["role"] == "user"), "")
        print(f"📄 추출된 사용자 메시지 길이: {len(user_message)}")
        
        if len(user_message) == 0:
            print("⚠️  빈 메시지 - 샘플 데이터로 응답")
        
        # OpenAI API를 호출하여 인수인계서 JSON 생성
        print("🤖 OpenAI API 호출 시작...")
        response = analyze_files_for_handover(user_message)
        print(f"✅ OpenAI 응답 완료 - 타입: {type(response)}")
        print(f"   응답 샘플: {str(response)[:200]}")
        
        # 응답 검증
        if not isinstance(response, dict):
            print(f"⚠️  응답이 dict가 아님: {type(response)} - 타입 변환 시도")
            if isinstance(response, str):
                try:
                    response = json.loads(response)
                except:
                    response = {"overview": {}, "jobStatus": {}}
        
        # 필수 필드 확인
        if "overview" not in response:
            print("⚠️  overview 필드 없음 - 기본값 추가")
            response["overview"] = {"transferor": {}, "transferee": {}}
        
        print(f"📤 최종 응답 필드: {list(response.keys())}")
        print(f"📊 최종 응답 크기: {len(str(response))} 글자")
        
        return {
            "content": response
        }
    except Exception as e:
        print(f"❌ Analyze error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        # messages 배열에서 사용자 메시지 추출
        messages = request.messages
        user_message = next((m["content"] for m in messages if m["role"] == "user"), "")
        
        if not user_message:
            return {
                "content": "메시지를 입력해주세요.",
                "response": "메시지를 입력해주세요."
            }
        
        print(f"💬 /chat 요청 수신 - 메시지: {user_message[:100]}")
        
        # 1. 관련 문서 검색
        search_results = search_documents(user_message)
        
        if not search_results:
            return {
                "content": "관련 문서를 찾을 수 없습니다. 먼저 문서를 업로드해주세요.",
                "response": "관련 문서를 찾을 수 없습니다. 먼저 문서를 업로드해주세요."
            }
        
        # 2. 컨텍스트 생성
        context = "\n\n".join([
            f"[{doc['file_name']}]\n{doc['content']}" 
            for doc in search_results
        ])
        
        # 3. GPT로 답변 생성
        response = chat_with_context(user_message, context)
        print(f"✅ 채팅 응답 완료 - {len(response)} 글자")
        
        return {
            "content": response,
            "response": response,
            "sources": [doc["file_name"] for doc in search_results]
        }
    except Exception as e:
        print(f"❌ Chat error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))