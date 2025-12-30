from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from app.config import AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT, AZURE_DOCUMENT_INTELLIGENCE_KEY

def get_document_client():
    return DocumentAnalysisClient(
        endpoint=AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
        credential=AzureKeyCredential(AZURE_DOCUMENT_INTELLIGENCE_KEY)
    )

def extract_text_from_url(blob_url: str) -> str:
    client = get_document_client()
    poller = client.begin_analyze_document_from_url("prebuilt-read", blob_url)
    result = poller.result()
    
    text = ""
    for page in result.pages:
        for line in page.lines:
            text += line.content + "\n"
    
    return text