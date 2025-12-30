import uuid
import traceback
from typing import Optional

from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.blob_service import upload_to_blob
from app.services.document_service import extract_text_from_url
from app.services.search_service import (
    add_document_to_index,
    get_document_count,
    list_all_indexes,
    set_current_index,
    get_current_index,
    list_documents,
)
from app.utils.logging_utils import safe_print

router = APIRouter()

class SelectIndexRequest(BaseModel):
    index_name: str

# ============================================================
# RAG 인덱스 관리 API
# ============================================================

@router.get("/indexes")
async def get_indexes():
    """사용 가능한 모든 RAG 인덱스 목록 조회"""
    try:
        indexes = list_all_indexes()
        current = get_current_index()
        safe_print(f"📚 인덱스 목록 반환: {len(indexes)}개, 현재 선택: {current}")
        return {
            "indexes": indexes,
            "current_index": current
        }
    except Exception as e:
        safe_print(f"❌ 인덱스 목록 조회 실패: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/indexes/select")
async def select_index(request: SelectIndexRequest):
    """사용할 RAG 인덱스 선택"""
    try:
        index_name = request.index_name
        set_current_index(index_name)
        safe_print(f"✅ 인덱스 선택됨: {index_name}")
        return {
            "message": f"인덱스 '{index_name}'가 선택되었습니다.",
            "current_index": index_name
        }
    except Exception as e:
        safe_print(f"❌ 인덱스 선택 실패: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/indexes/current")
async def get_current():
    """현재 선택된 인덱스 조회"""
    current = get_current_index()
    return {"current_index": current}

# ============================================================
# 파일 업로드 API
# ============================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    index_name: Optional[str] = Query(default=None),
    index_names: Optional[str] = Query(default=None),
):
    try:
        # 1. 파일 데이터 읽기
        file_data = await file.read()

        # 2. 파일 확장자 확인
        file_ext = file.filename.lower().split('.')[-1] if '.' in file.filename else ''

        # 3. Blob 업로드 (txt 포함) + 텍스트 추출
        blob_url = None
        try:
            safe_print(f"📤 Blob 업로드 시도: {file.filename}")
            blob_url = upload_to_blob(file.filename, file_data)
            safe_print(f"✅ Blob 업로드 완료: {blob_url}")
        except Exception as blob_error:
            safe_print(f"⚠️  Blob 업로드 실패: {blob_error}")

        if file_ext == 'txt':
            # txt 파일은 직접 디코딩
            try:
                extracted_text = file_data.decode('utf-8')
            except UnicodeDecodeError:
                extracted_text = file_data.decode('cp949', errors='ignore')
        else:
            # PDF, 이미지 등은 Blob 업로드 후 Document Intelligence 사용
            try:
                if not blob_url:
                    raise Exception("Blob URL이 없습니다.")
                safe_print("🔍 Document Intelligence로 텍스트 추출 시작...")
                extracted_text = extract_text_from_url(blob_url)
                safe_print(f"✅ 텍스트 추출 완료 ({len(extracted_text)} 글자)")
            except Exception as doc_error:
                safe_print(f"⚠️  Document Intelligence 실패: {doc_error}")
                # Document Intelligence 실패 시 파일명과 기본 메시지로 폴백
                extracted_text = f"[파일명: {file.filename}]\n[주의: 자동 텍스트 추출 실패. Document Intelligence 설정 필요]\n\n파일을 텍스트로 변환하여 업로드해주세요."

        # 4. AI Search에 인덱싱 (실패해도 텍스트는 반환)
        doc_id = str(uuid.uuid4())
        target_indexes = (
            [name.strip() for name in index_names.split(",") if name.strip()]
            if index_names
            else [index_name] if index_name else [get_current_index()]
        )
        try:
            for target_index in target_indexes:
                add_document_to_index(doc_id, extracted_text, file.filename, target_index)
            safe_print(f"✅ AI Search 인덱싱 완료 ({len(target_indexes)}개)")
        except Exception as index_error:
            safe_print(f"⚠️  AI Search 인덱싱 실패 (계속 진행): {index_error}")

        return {
            "message": "문서 업로드 완료",
            "file_name": file.filename,
            "doc_id": doc_id,
            "extracted_text": extracted_text,
            "blob_url": blob_url,
            "index_names": target_indexes,
        }
    except Exception as e:
        safe_print(f"❌ Upload error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@router.get("/stats")
async def get_stats():
    """시스템 통계 조회 - 최근 업로드 갯수, 인덱스 문서 갯수"""
    try:
        doc_count = get_document_count()
        safe_print(f"📊 시스템 통계: {doc_count}개 문서 인덱싱됨")

        return {
            "total_documents": doc_count,
            "recent_uploads": doc_count,  # AI Search에 인덱싱된 모든 문서
            "status": "✅ Active"
        }
    except Exception as e:
        safe_print(f"❌ Stats error: {e}")
        return {
            "total_documents": 0,
            "recent_uploads": 0,
            "status": "⚠️ Error"
        }

@router.get("/documents")
async def list_documents_endpoint(index_names: Optional[str] = Query(default=None)):
    """AI Search 인덱스에 저장된 모든 문서 목록 조회 - 실제 content 포함"""
    try:
        target_indexes = (
            [name.strip() for name in index_names.split(",") if name.strip()]
            if index_names
            else None
        )
        docs = list_documents(index_names=target_indexes, top=100)
        safe_print(f"📋 API 응답: {len(docs)}개 문서 (실제 content 포함)")
        return {
            "count": len(docs),
            "documents": docs
        }
    except Exception as e:
        safe_print(f"❌ Documents list error: {e}")
        traceback.print_exc()
        return {
            "count": 0,
            "documents": []
        }
