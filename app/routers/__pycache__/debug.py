from fastapi import APIRouter, Depends
from app.config import (
    validate_config, 
    get_search_index, 
    set_search_index,
    get_storage_container,
    set_storage_container,
)
from app.services.search_service import get_document_count, list_indexes
from app.services.blob_service import get_blob_count, list_containers
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/debug/summary")
def summary(user: str = Depends(get_current_user)):
    """시스템 상태 요약 (인증 필요)"""
    missing = validate_config()
    return {
        "config_ok": len(missing) == 0,
        "missing": missing,
        "document_count": get_document_count(),
        "blob_count": get_blob_count(),
        "current_index": get_search_index(),
        "current_container": get_storage_container(),
    }


@router.get("/debug/indexes")
def get_indexes(user: str = Depends(get_current_user)):
    """AI Search 인덱스 목록 조회"""
    return {
        "indexes": list_indexes(),
        "current": get_search_index(),
    }


@router.get("/debug/containers")
def get_containers(user: str = Depends(get_current_user)):
    """Blob Storage 컨테이너 목록 조회"""
    return {
        "containers": list_containers(),
        "current": get_storage_container(),
    }


@router.post("/debug/indexes/{index_name}")
def switch_index(index_name: str, user: str = Depends(get_current_user)):
    """AI Search 인덱스 변경 (런타임)"""
    set_search_index(index_name)
    return {
        "success": True,
        "current_index": get_search_index(),
    }


@router.post("/debug/containers/{container_name}")
def switch_container(container_name: str, user: str = Depends(get_current_user)):
    """Blob Storage 컨테이너 변경 (런타임)"""
    set_storage_container(container_name)
    return {
        "success": True,
        "current_container": get_storage_container(),
    }
