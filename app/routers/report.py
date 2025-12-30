from fastapi import APIRouter, HTTPException

from app.services.search_service import (
    get_current_index,
    get_document_count,
    list_all_indexes,
)
from app.utils.logging_utils import log_exception, safe_print

router = APIRouter()


@router.get("/")
async def report_status():
    """시스템 리포트: 인덱스/문서 상태 요약."""
    try:
        indexes = list_all_indexes()
        current_index = get_current_index()
        document_count = get_document_count()
        safe_print(
            "📊 리포트 생성 완료 - "
            f"indexes={len(indexes)}, current={current_index}, docs={document_count}"
        )
        return {
            "current_index": current_index,
            "document_count": document_count,
            "indexes": indexes,
        }
    except Exception as e:
        log_exception("❌ Report error: ", e)
        raise HTTPException(status_code=500, detail=str(e))
