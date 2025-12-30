from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType,
    VectorSearch,
    HnswAlgorithmConfiguration,
    VectorSearchProfile,
    SearchField
)
from azure.core.credentials import AzureKeyCredential
from app.config import AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY
from typing import List, Optional

from app.services.openai_service import get_embedding
from app.utils.logging_utils import log_exception, safe_print

# 현재 선택된 인덱스 (기본값)
INDEX_NAME = "documents-index"
_current_index = INDEX_NAME

def set_current_index(index_name: str):
    """현재 사용할 인덱스 설정"""
    global _current_index
    _current_index = index_name
    safe_print(f"🔄 현재 인덱스 변경: {index_name}")

def get_current_index() -> str:
    """현재 선택된 인덱스 이름 반환"""
    return _current_index

def get_search_index_client():
    return SearchIndexClient(
        endpoint=AZURE_SEARCH_ENDPOINT,
        credential=AzureKeyCredential(AZURE_SEARCH_KEY)
    )

def get_search_client(index_name: str = None):
    """지정된 인덱스 또는 현재 선택된 인덱스의 SearchClient 반환"""
    target_index = index_name or _current_index
    return SearchClient(
        endpoint=AZURE_SEARCH_ENDPOINT,
        index_name=target_index,
        credential=AzureKeyCredential(AZURE_SEARCH_KEY)
    )

def list_all_indexes():
    """Azure AI Search의 모든 인덱스 목록 조회"""
    try:
        index_client = get_search_index_client()
        indexes = list(index_client.list_indexes())
        result = []
        for idx in indexes:
            # 각 인덱스의 문서 개수 조회
            try:
                search_client = get_search_client(idx.name)
                results = search_client.search(search_text="*", include_total_count=True, top=1)
                doc_count = results.get_count() or 0
            except:
                doc_count = 0

            result.append({
                "name": idx.name,
                "document_count": doc_count,
                "is_current": idx.name == _current_index
            })
        safe_print(f"📚 인덱스 목록 조회: {len(result)}개")
        return result
    except Exception as e:
        log_exception("❌ 인덱스 목록 조회 실패: ", e)
        return []

def create_index_if_not_exists(index_name: str = None):
    target_index = index_name or _current_index
    index_client = get_search_index_client()

    try:
        index_client.get_index(target_index)
        return
    except Exception:
        pass

    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SimpleField(name="file_name", type=SearchFieldDataType.String, filterable=True),
        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=1536,
            vector_search_profile_name="my-vector-profile"
        )
    ]

    vector_search = VectorSearch(
        algorithms=[
            HnswAlgorithmConfiguration(name="my-hnsw")
        ],
        profiles=[
            VectorSearchProfile(
                name="my-vector-profile",
                algorithm_configuration_name="my-hnsw"
            )
        ]
    )

    index = SearchIndex(name=target_index, fields=fields, vector_search=vector_search)
    index_client.create_index(index)

def add_document_to_index(
    doc_id: str,
    content: str,
    file_name: str,
    index_name: str = None
):
    create_index_if_not_exists(index_name)
    search_client = get_search_client(index_name)

    # 긴 문서는 청크로 나누기
    max_length = 8000
    if len(content) > max_length:
        content = content[:max_length]

    embedding = get_embedding(content)

    document = {
        "id": doc_id,
        "content": content,
        "file_name": file_name,
        "content_vector": embedding
    }

    search_client.upload_documents([document])

def search_documents(query: str, top_k: int = 3, index_names: Optional[List[str]] = None):
    from azure.search.documents.models import VectorizedQuery

    target_indexes = index_names or [_current_index]
    query_embedding = get_embedding(query)
    docs = []

    for index_name in target_indexes:
        try:
            search_client = get_search_client(index_name)
            vector_query = VectorizedQuery(
                vector=query_embedding,
                k_nearest_neighbors=top_k,
                fields="content_vector"
            )
            results = search_client.search(
                search_text=query,
                vector_queries=[vector_query],
                top=top_k
            )
            for result in results:
                docs.append({
                    "content": result["content"],
                    "file_name": result["file_name"],
                    "score": result["@search.score"],
                    "index_name": index_name,
                })
        except Exception as e:
            log_exception(f"⚠️  인덱스 검색 실패 ({index_name}): ", e)

    docs.sort(key=lambda item: item.get("score", 0), reverse=True)
    return docs[:top_k]


def list_documents(index_names: Optional[List[str]] = None, top: int = 100) -> list:
    """AI Search 인덱스의 문서 목록 조회 (content 포함)."""
    target_indexes = index_names or [_current_index]
    docs = []
    try:
        for index_name in target_indexes:
            try:
                search_client = get_search_client(index_name)
                results = search_client.search(
                    search_text="*",
                    include_total_count=True,
                    top=top
                )
                for result in results:
                    content = result.get("content", "")
                    docs.append({
                        "id": result.get("id", ""),
                        "file_name": result.get("file_name", "Unknown"),
                        "content": content,
                        "content_length": len(content),
                        "index_name": index_name,
                    })
            except Exception as e:
                log_exception(f"⚠️  인덱스 문서 조회 실패 ({index_name}): ", e)
        safe_print(f"📋 API 문서 조회: {len(docs)}개 문서")
        return docs
    except Exception as e:
        log_exception("❌ 문서 목록 조회 실패: ", e)
        return []

def get_document_count() -> int:
    """AI Search 인덱스의 총 문서 개수 조회"""
    try:
        search_client = get_search_client()
        # $count=true로 정확한 문서 개수 조회
        results = search_client.search(
            search_text="*",
            include_total_count=True,
            top=1
        )
        count = results.get_count()
        safe_print(f"📊 인덱스 문서 개수: {count}")
        return count if count else 0
    except Exception as e:
        log_exception("⚠️  문서 개수 조회 실패: ", e)
        return 0

def get_all_documents() -> list:
    """AI Search 인덱스의 모든 문서 목록 조회"""
    try:
        search_client = get_search_client()
        results = search_client.search(
            search_text="*",
            include_total_count=True,
            top=1000  # 최대 1000개 조회
        )
        docs = []
        for result in results:
            docs.append({
                "id": result["id"],
                "file_name": result.get("file_name", "Unknown"),
                "content_length": len(result.get("content", ""))
            })
        safe_print(f"📋 인덱싱된 문서 목록: {len(docs)}개")
        for doc in docs:
            safe_print(
                f"   - {doc['file_name']} (ID: {doc['id']}, 길이: {doc['content_length']})"
            )
        return docs
    except Exception as e:
        log_exception("⚠️  문서 목록 조회 실패: ", e)
        return []
