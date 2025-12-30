import os
from dotenv import load_dotenv

# proto.env 파일 경로 지정
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), "proto.env"))

# Storage Account
AZURE_STORAGE_ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
AZURE_STORAGE_ACCOUNT_KEY = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")

# Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
AZURE_DOCUMENT_INTELLIGENCE_KEY = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")

# AI Search
AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_KEY = os.getenv("AZURE_SEARCH_KEY")

# Azure OpenAI
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")

# 환경변수 검증
def validate_config():
    required = [
        ("AZURE_STORAGE_ACCOUNT_NAME", AZURE_STORAGE_ACCOUNT_NAME),
        ("AZURE_STORAGE_ACCOUNT_KEY", AZURE_STORAGE_ACCOUNT_KEY),
        ("AZURE_OPENAI_ENDPOINT", AZURE_OPENAI_ENDPOINT),
        ("AZURE_OPENAI_API_KEY", AZURE_OPENAI_API_KEY),
        ("AZURE_SEARCH_ENDPOINT", AZURE_SEARCH_ENDPOINT),
        ("AZURE_SEARCH_KEY", AZURE_SEARCH_KEY),
    ]
    missing = [name for name, value in required if not value]
    if missing:
        print(f"⚠️  Missing environment variables: {', '.join(missing)}")
        print("   Please check your proto.env file")
    return len(missing) == 0