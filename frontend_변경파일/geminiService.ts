import { HandoverData, SourceFile } from "../types";

/**
 * ============================================================
 * [API 연결 설정] - 동료 개발용
 * ============================================================
 * 
 * 🔧 프론트엔드 개발자: 아래 BACKEND_URL을 백엔드 개발자 IP로 변경하세요
 * 
 * 현재 백엔드 서버: http://59.22.78.84:8000
 * ============================================================
 */
const CONFIG = {
  USE_LOCAL_BACKEND: true,
  // ⭐ 백엔드 서버 주소 (백엔드 개발자 IP)
  LOCAL_BACKEND_URL: "http://59.22.78.84:8000",

  // Azure 직접 호출 설정 (USE_LOCAL_BACKEND가 false일 때만 사용)
  AZURE_ENDPOINT: "https://YOUR_RESOURCE_NAME.openai.azure.com",
  AZURE_KEY: "YOUR_AZURE_API_KEY",
  DEPLOYMENT_NAME: "YOUR_DEPLOYMENT_NAME",
  API_VERSION: "2024-02-15-preview",
};

/**
 * 백엔드 URL 반환
 */
export const getBackendUrl = (): string => {
  return CONFIG.LOCAL_BACKEND_URL;
};

/**
 * 공통 요청 함수
 * 사용자님의 백엔드 API 규격에 맞춰 fetch 부분을 수정할 수 있습니다.
 */
async function callAI(path: string, payload: any) {
  let url = "";
  let headers: Record<string, string> = { "Content-Type": "application/json" };
  let body = JSON.stringify(payload);

  if (CONFIG.USE_LOCAL_BACKEND) {
    // 로컬 백엔드로 보낼 때
    url = `${CONFIG.LOCAL_BACKEND_URL}/api${path}`;
  } else {
    // Azure OpenAI로 직접 보낼 때
    url = `${CONFIG.AZURE_ENDPOINT}/openai/deployments/${CONFIG.DEPLOYMENT_NAME}/chat/completions?api-version=${CONFIG.API_VERSION}`;
    headers["api-key"] = CONFIG.AZURE_KEY;
    // Azure Chat Completion 규격에 맞춰 페이로드 재구성
    body = JSON.stringify({
      messages: payload.messages,
      response_format: payload.response_format,
      temperature: payload.temperature || 0.7,
    });
  }

  try {
    console.log(`🌐 ${path} 요청:`, {
      url,
      method: "POST",
      headerKeys: Object.keys(headers),
    });
    console.log(`📊 페이로드 크기: ${body.length} bytes`);

    const fetchOptions: RequestInit = {
      method: "POST",
      headers: headers,
      body: body,
      mode: "cors",
      // credentials 제거 - CORS wildcard와 충돌 방지
    };

    const response = await fetch(url, fetchOptions);
    console.log(`📨 ${path} 응답 상태:`, response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${path} HTTP 에러:`, response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(
          `API 에러 (${response.status}): ${errorJson.detail || errorText}`
        );
      } catch {
        throw new Error(`API 에러 (${response.status}): ${errorText}`);
      }
    }

    const result = await response.json();
    console.log(`✅ ${path} 성공 응답:`, result);

    // 사용자 백엔드 서버의 응답 구조에 따라 아래 return 문을 수정해야 할 수 있습니다.
    // Azure OpenAI 직접 호출 시: result.choices[0].message.content
    if (CONFIG.USE_LOCAL_BACKEND) {
      // 백엔드 응답이 content 필드에 있음
      const content = result.content || result.response;

      // content가 이미 object인 경우
      if (typeof content === "object") {
        console.log("✅ content가 이미 object 형태");
        return content;
      }

      // content가 string인 경우 JSON 파싱
      if (typeof content === "string") {
        try {
          console.log("🔍 content를 JSON으로 파싱 시도");
          return JSON.parse(content);
        } catch (e) {
          console.warn(
            "⚠️  content JSON 파싱 실패, 원본 반환:",
            content.substring(0, 200)
          );
          return content;
        }
      }

      return content;
    } else {
      return result.choices[0].message.content;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`🔴 callAI 전체 에러 [${path}]:`, errorMsg);
    console.error(`   URL: ${url}`);
    console.error(`   원본 에러:`, error);
    throw error;
  }
}

/**
 * Base64 디코딩 헬퍼 함수
 */
function decodeBase64(base64String: string): string {
  try {
    return atob(base64String);
  } catch (e) {
    console.warn("Base64 디코딩 실패:", e);
    return base64String;
  }
}

/**
 * [분석] 인수인계서 생성
 */
export const analyzeFilesForHandover = async (
  files: SourceFile[]
): Promise<HandoverData> => {
  // 파일 내용을 텍스트로 변환 (텍스트 파일 직접 사용)
  const fileContext = files
    .map((f) => {
      const content = f.content.substring(0, 2000); // 첫 2000자 사용
      return `[파일명: ${f.name}]\n${content}`;
    })
    .join("\n\n---\n");

  console.log("📄 생성된 파일 컨텍스트:", fileContext.substring(0, 500));

  const payload = {
    messages: [
      {
        role: "system",
        content:
          "당신은 인수인계서 생성 전문가입니다. 반드시 JSON 형식으로만 답변하세요.",
      },
      {
        role: "user",
        content: `다음 자료를 분석해 인수인계서 JSON을 만들어줘. 파일이 없으면 샘플 데이터로 만들어줘:\n\n${fileContext}`,
      },
    ],
    response_format: { type: "json_object" },
  };

  try {
    console.log("🔍 analyzeFilesForHandover 호출 - 파일수:", files.length);
    const responseData = await callAI("/analyze", payload);
    console.log(
      "📦 API 응답 타입:",
      typeof responseData,
      "내용:",
      responseData
    );

    // responseData가 이미 object인 경우
    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "overview" in responseData
    ) {
      console.log("✅ 응답이 이미 HandoverData 형태");
      return responseData as HandoverData;
    }

    // responseData가 string인 경우 JSON 파싱
    if (typeof responseData === "string") {
      try {
        console.log("🔍 응답을 JSON으로 파싱");
        const parsed = JSON.parse(responseData);
        return parsed as HandoverData;
      } catch (e) {
        console.error(
          "❌ JSON 파싱 실패:",
          e,
          "원본:",
          responseData.substring(0, 200)
        );
        throw new Error(`JSON 파싱 실패: ${e}`);
      }
    }

    console.log("✨ 최종 결과:", responseData);
    return responseData as HandoverData;
  } catch (error) {
    console.error("❌ analyzeFilesForHandover 에러:", error);
    throw error;
  }
};

/**
 * [채팅] 지능형 상담
 */
export const chatWithGemini = async (
  message: string,
  files: SourceFile[],
  history: { role: string; text: string }[]
): Promise<string> => {
  const payload = {
    messages: [
      { role: "system", content: "당신은 인수인계 도우미 '꿀단지'입니다." },
      ...history.map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ],
  };

  // 채팅은 텍스트 응답이므로 직접 fetch 호출
  const url = `${CONFIG.LOCAL_BACKEND_URL}/api/chat`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    mode: "cors",
  });

  if (!response.ok) {
    throw new Error(`채팅 API 에러: ${response.status}`);
  }

  const result = await response.json();
  // 채팅 응답은 content 또는 response 필드에 문자열로 들어있음
  return result.content || result.response || "응답을 받지 못했습니다.";
};

// ============================================================
// RAG 인덱스 관리 API
// ============================================================

export interface RagIndex {
  name: string;
  document_count: number;
  is_current: boolean;
}

/**
 * 사용 가능한 모든 RAG 인덱스 목록 조회
 */
export const getIndexes = async (): Promise<{ indexes: RagIndex[]; current_index: string }> => {
  const url = `${CONFIG.LOCAL_BACKEND_URL}/api/upload/indexes`;
  console.log("📚 인덱스 목록 조회:", url);
  
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`인덱스 목록 조회 실패: ${response.status}`);
  }
  return await response.json();
};

/**
 * 사용할 RAG 인덱스 선택
 */
export const selectIndex = async (indexName: string): Promise<{ message: string; current_index: string }> => {
  const url = `${CONFIG.LOCAL_BACKEND_URL}/api/upload/indexes/select`;
  console.log("🔄 인덱스 선택:", indexName);
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index_name: indexName }),
    mode: "cors",
  });
  
  if (!response.ok) {
    throw new Error(`인덱스 선택 실패: ${response.status}`);
  }
  return await response.json();
};

/**
 * 사용할 RAG 인덱스 여러개 선택 (멀티 선택)
 */
export const selectMultipleIndexes = async (indexNames: string[]): Promise<{ message: string; selected_indexes: string[] }> => {
  const url = `${CONFIG.LOCAL_BACKEND_URL}/api/upload/indexes/select-multiple`;
  console.log("🔄 인덱스 멀티 선택:", indexNames);
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index_names: indexNames }),
    mode: "cors",
  });
  
  if (!response.ok) {
    throw new Error(`인덱스 멀티 선택 실패: ${response.status}`);
  }
  return await response.json();
};

/**
 * 현재 선택된 인덱스 조회
 */
export const getCurrentIndex = async (): Promise<{ current_index: string; selected_indexes: string[] }> => {
  const url = `${CONFIG.LOCAL_BACKEND_URL}/api/upload/indexes/current`;
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`현재 인덱스 조회 실패: ${response.status}`);
  }
  return await response.json();
};

/**
 * 백엔드 연결 상태 확인
 */
export const checkBackendHealth = async (): Promise<{
  connected: boolean;
  status?: string;
  error?: string;
}> => {
  try {
    const url = `${CONFIG.LOCAL_BACKEND_URL}/api/health`;
    const response = await fetch(url, { 
      mode: "cors",
      signal: AbortSignal.timeout(5000)  // 5초 타임아웃
    });
    
    if (response.ok) {
      const data = await response.json();
      return { connected: true, status: data.status };
    } else {
      return { connected: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : "연결 실패" 
    };
  }
};

/**
 * 백엔드 URL 설정 변경 (동적)
 */
export const setBackendUrl = (url: string): void => {
  CONFIG.LOCAL_BACKEND_URL = url;
  console.log("🔧 백엔드 URL 변경됨:", url);
};
