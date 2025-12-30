from openai import AzureOpenAI
from app.config import AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY
import json
import traceback

def get_openai_client():
    return AzureOpenAI(
        api_key=AZURE_OPENAI_API_KEY,
        api_version="2024-02-15-preview",
        azure_endpoint=AZURE_OPENAI_ENDPOINT
    )

def get_embedding(text: str) -> list:
    client = get_openai_client()
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def analyze_files_for_handover(file_context: str) -> dict:
    """파일 내용을 분석하여 인수인계서 JSON 생성 - 프론트엔드 HandoverData 형식으로 반환"""
    from app.services.search_service import get_search_client
    
    client = get_openai_client()
    
    # Azure Search에서 모든 문서의 실제 내용 직접 검색
    print("📄 Azure Search에서 모든 문서 검색 중...")
    try:
        search_client = get_search_client()
        results = search_client.search(search_text="*", include_total_count=True, top=10)
        
        doc_contents = []
        for result in results:
            file_name = result.get("file_name", "Unknown")
            content = result.get("content", "")
            if content and len(content) > 0:
                # 최대 1000자까지만 포함
                content_preview = content[:1000]
                doc_contents.append(f"[파일: {file_name}]\n{content_preview}\n")
                print(f"✅ 문서 포함됨: {file_name} ({len(content)} 글자)")
        
        if doc_contents:
            print(f"📋 {len(doc_contents)}개 문서 검색됨")
            indexed_context = "\n".join(doc_contents)
            file_context = indexed_context if not file_context else file_context + "\n\n---\n\n" + indexed_context
        else:
            print("⚠️  검색 결과가 비어있음")
    except Exception as e:
        print(f"⚠️  문서 검색 실패: {e}")
        traceback.print_exc()
    
    # 파일이 없거나 매우 짧으면 샘플 데이터 추가
    if not file_context or len(file_context.strip()) < 20:
        print("ℹ️  파일 컨텍스트가 부족함 - 샘플 데이터 추가")
        file_context += """

[샘플: 프로젝트 현황 보고]
프로젝트명: 시스템 고도화
담당자: 김철수 과장 (kim.cs@company.com)
인수자: 이영희 대리 (lee.yh@company.com)
인수 예정일: 2025-02-15
개발현황: 70% 진행 중 (메인 기능 개발 완료, 최적화 진행 중)
주요 담당 업무: 백엔드 API 개발, 데이터베이스 설계, 보안 구현
팀원: 박준호(프론트엔드), 최민수(QA)
위험요소: 일정 지연 가능성 (2주)
다음 마일스톤: 2025-02-01 알파 테스트"""
    
    print(f"📊 최종 컨텍스트 길이: {len(file_context)} 글자")

    system_message = """
당신은 인수인계서 생성 전문가입니다. 반드시 유효한 JSON 형식으로만 답변하세요.

아래 자료는 AI Search 인덱스에서 추출된 업무 문서의 요약 또는 원문입니다. 자료가 많을 경우 중복되거나 불필요한 내용은 통합·요약하고, 실제 인수인계서처럼 구체적이고 실무적으로 작성하세요.

자료에 포함된 정보는 최대한 반영하고, 자료가 부족하거나 없는 항목은 빈 배열([]) 또는 빈 문자열("")로 채워주세요. 자료가 너무 많으면 핵심 내용 위주로 요약해도 됩니다.

응답 형식 (프론트엔드 요구사항에 맞춤):
{
    "overview": {
        "transferor": {"name": "인계자명", "position": "직급/부서", "contact": "연락처"},
        "transferee": {"name": "인수자명", "position": "직급/부서", "contact": "연락처", "startDate": "시작일"},
        "reason": "인수인계 사유",
        "background": "업무 배경",
        "period": "근무 기간",
        "schedule": [{"date": "날짜", "activity": "활동"}]
    },
    "jobStatus": {
        "title": "직책",
        "responsibilities": ["책임내용1", "책임내용2"],
        "authority": "권한",
        "reportingLine": "보고체계",
        "teamMission": "팀 미션",
        "teamGoals": ["목표1", "목표2"]
    },
    "priorities": [
        {"rank": 1, "title": "우선과제명", "status": "상태", "solution": "해결방안", "deadline": "마감일"}
    ],
    "stakeholders": {
        "manager": "상급자",
        "internal": [{"name": "이름", "role": "역할"}],
        "external": [{"name": "이름", "role": "역할"}]
    },
    "teamMembers": [
        {"name": "팀원명", "position": "직급", "role": "역할", "notes": "비고"}
    ],
    "ongoingProjects": [
        {"name": "프로젝트명", "owner": "담당자", "status": "상태", "progress": 50, "deadline": "마감일", "description": "설명"}
    ],
    "risks": {"issues": "현안", "risks": "위험요소"},
    "roadmap": {"shortTerm": "단기계획", "longTerm": "장기계획"},
    "resources": {
        "docs": [{"category": "분류", "name": "문서명", "location": "위치"}],
        "systems": [{"name": "시스템명", "usage": "사용방법", "contact": "담당자"}],
        "contacts": [{"category": "분류", "name": "이름", "position": "직급", "contact": "연락처"}]
    },
    "checklist": [{"text": "확인항목", "completed": false}]
}
"""

    user_message = f"""
아래는 AI Search 인덱스에서 추출된 업무 자료(요약/원문)입니다. 이 자료들을 분석하여 실제 업무 인수인계서처럼 구체적이고 실무적으로 JSON을 작성해 주세요.

자료가 많으면 중복/불필요한 내용은 통합·요약하고, 자료에 있는 정보는 최대한 반영하세요. 없는 항목은 빈 배열([]) 또는 빈 문자열("")로 남겨두세요.

자료:
{file_context}

위의 JSON 형식을 반드시 따르세요.
"""

    try:
        print(f"🚀 Azure OpenAI 호출 시작...")
        print(f"   - 엔드포인트: {AZURE_OPENAI_ENDPOINT}")
        print(f"   - 컨텍스트 길이: {len(file_context)}")

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )

        print(f"✅ OpenAI 응답 수신")
        response_text = response.choices[0].message.content
        print(f"   응답 길이: {len(response_text)} 글자")

        # JSON 파싱 시도
        try:
            print(f"🔍 JSON 파싱 시도...")
            result = json.loads(response_text)
            print(f"✅ JSON 파싱 성공 - 키: {list(result.keys())}")
            return result
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON 파싱 실패: {e}")
            # JSON 파싱 실패 시 기본 구조 반환
            return {
                "overview": {
                    "transferor": {"name": "", "position": "", "contact": ""},
                    "transferee": {"name": "", "position": "", "contact": ""}
                },
                "jobStatus": {"title": "", "responsibilities": []},
                "priorities": [],
                "stakeholders": {"manager": "", "internal": [], "external": []},
                "teamMembers": [],
                "ongoingProjects": [],
                "risks": {"issues": "", "risks": ""},
                "roadmap": {"shortTerm": "", "longTerm": ""},
                "resources": {"docs": [], "systems": [], "contacts": []},
                "checklist": [],
                "rawContent": response_text
            }
    except Exception as e:
        print(f"❌ Azure OpenAI 호출 실패: {e}")
        traceback.print_exc()
        # system_message 등 로컬 변수 참조 없이 에러만 반환
        raise Exception(f"API 에러: {e}")

def chat_with_context(query: str, context: str) -> str:
    client = get_openai_client()
    
    system_message = """당신은 '꿀단지' 인수인계서 생성 AI입니다. 🍯

## 핵심 원칙
1. **문서 내용을 반드시 먼저 분석**하세요
2. 문서에서 찾은 **실제 정보**를 답변에 포함하세요
3. 사용자 질문에 맞게 유연하게 답변하세요

## 인수인계서 생성 시 참고할 구조
사용자가 인수인계서 생성을 요청하면, 아래 섹션 중 문서에서 확인된 정보만 작성하세요:

1. **인적 정보**: 인계자/인수자 이름, 부서, 연락처, 인계 사유
2. **직무 현황**: 직무명, 핵심 책임, 보고 체계
3. **우선 과제**: 시급한 과제 Top 3, 주요 이해관계자, 팀 구성원
4. **진행 중 업무**: 프로젝트 현황, 미결 사항, 향후 계획
5. **핵심 자료**: 참고 문서, 시스템 접근 정보, 연락처

## 답변 규칙
- 📌 문서에 있는 내용은 **구체적으로 인용**하세요
- 📌 문서에 없는 내용만 "해당 정보가 문서에 없습니다"라고 표시
- 📌 일반적인 질문에는 문서 내용을 바탕으로 자연스럽게 답변
- 📌 이모지를 적절히 사용해 가독성을 높이세요 🐝"""

    user_message = f"""[참고 문서]
{context}

[질문]
{query}

위 문서 내용을 꼼꼼히 분석하여 질문에 답변해주세요. 문서에 있는 실제 정보를 인용해서 답변하세요."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in chat_with_context: {e}")
        traceback.print_exc()
        raise