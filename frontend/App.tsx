import React, { useState, useEffect } from "react";
import SourceSidebar from "./components/SourceSidebar";
import ChatWindow from "./components/ChatWindow";
import HandoverForm from "./components/HandoverForm";
import LoginScreen from "./components/LoginScreen";
import {
  SourceFile,
  ChatMessage,
  HandoverData,
  ViewMode,
  ChatSession,
} from "./types";
import {
  analyzeFilesForHandover,
  chatWithGemini,
} from "./services/geminiService";

const STORAGE_KEY_SESSIONS = "honeycomb_chat_sessions";
const STORAGE_KEY_CURRENT_SESSION = "honeycomb_current_session";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [handoverData, setHandoverData] = useState<HandoverData | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CHAT);
  const [isProcessing, setIsProcessing] = useState(false);

  // 채팅 세션 관리
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // localStorage에서 세션 로드
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    const savedCurrentSession = localStorage.getItem(
      STORAGE_KEY_CURRENT_SESSION
    );

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setChatSessions(parsed);
        console.log("✅ 저장된 채팅 세션 로드됨:", parsed.length, "개");
      } catch (error) {
        console.error("❌ 세션 로드 실패:", error);
      }
    }

    if (savedCurrentSession) {
      setCurrentSessionId(savedCurrentSession);
    }
  }, []);

  // 세션 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(chatSessions));
    console.log("💾 채팅 세션 저장됨:", chatSessions.length, "개");
  }, [chatSessions]);

  // 현재 세션 변경 시 저장
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, currentSessionId);
    }
  }, [currentSessionId]);

  // 세션 선택 시 메시지 로드
  useEffect(() => {
    const selectedSession = chatSessions.find(
      (session) => session.id === currentSessionId
    );
    if (selectedSession) {
      setMessages(selectedSession.messages);
      console.log(
        "📂 세션 로드됨:",
        selectedSession.title,
        "메시지",
        selectedSession.messages.length,
        "개"
      );
    }
  }, [currentSessionId, chatSessions]);

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setViewMode(ViewMode.CHAT_HISTORY);
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setViewMode(ViewMode.CHAT);
  };

  const handleFileUpload = (newFiles: SourceFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsProcessing(true);

    // 새 세션 생성 (현재 세션이 없을 경우)
    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: newSessionId,
        title: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
        messages: updatedMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSessionId);
    } else {
      // 기존 세션에 메시지 추가
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: updatedMessages,
                updatedAt: new Date(),
              }
            : session
        )
      );
    }

    try {
      const responseText = await chatWithGemini(text, files, updatedMessages);
      const aiMsg: ChatMessage = { role: "assistant", text: responseText };
      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // 세션에 AI 응답 메시지 추가
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: finalMessages,
                updatedAt: new Date(),
              }
            : session
        )
      );
    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        role: "assistant",
        text: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      };
      setMessages((prev) => [...prev, errorMsg]);

      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...updatedMessages, errorMsg],
                updatedAt: new Date(),
              }
            : session
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateHandover = async () => {
    setIsProcessing(true);
    try {
      let filesToAnalyze = files;

      // 업로드된 파일이 없으면 AI Search 인덱스에서 문서 가져오기
      if (files.length === 0) {
        console.log(
          "📚 업로드된 파일이 없음 - AI Search 인덱스에서 문서 조회..."
        );
        try {
          const response = await fetch(
            "http://localhost:8000/api/upload/documents"
          );
          if (response.ok) {
            const data = await response.json();
            if (data.documents && data.documents.length > 0) {
              console.log(`✅ 인덱스에서 ${data.documents.length}개 문서 조회`);
              // 인덱스 문서들을 SourceFile 형식으로 변환
              filesToAnalyze = data.documents.map((doc: any, idx: number) => ({
                id: doc.id,
                name: doc.file_name,
                type: "text/plain",
                content: doc.content || `[파일: ${doc.file_name}]\n`, // 실제 content 사용!
                mimeType: "text/plain",
              }));
              console.log(
                `📄 변환된 파일 수: ${
                  filesToAnalyze.length
                }, 총 길이: ${filesToAnalyze.reduce(
                  (sum, f) => sum + f.content.length,
                  0
                )}`
              );
            } else {
              alert(
                "업로드된 파일도 없고, AI Search 인덱스에도 문서가 없습니다. 먼저 자료를 추가해주세요!"
              );
              setIsProcessing(false);
              return;
            }
          }
        } catch (error) {
          console.error("❌ 인덱스 조회 실패:", error);
          alert("자료 보관함에 업무 파일을 추가해 주세요!");
          setIsProcessing(false);
          return;
        }
      }

      console.log("📊 인수인계서 분석 시작...", filesToAnalyze);
      const data = await analyzeFilesForHandover(filesToAnalyze);
      console.log("✅ 분석 완료:", data);
      setHandoverData(data);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "자료 분석을 기반으로 인터랙티브 인수인계서 초안을 완성했습니다! 왼쪽 리포트 영역에서 내용을 확인하고 직접 수정하거나 새로운 항목을 추가할 수 있습니다.",
        },
      ]);
    } catch (error) {
      console.error("❌ 분석 실패:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`인수인계서 생성에 실패했습니다.\n\n오류: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-[#FFFDF0] text-gray-900 overflow-hidden relative">
      <div className="honeycomb-bg"></div>

      {/* Sidebar: Storage (Fixed Left) */}
      <SourceSidebar
        files={files}
        onUpload={handleFileUpload}
        onRemove={handleFileRemove}
      />

      <main className="flex-1 flex gap-8 p-8 overflow-hidden relative z-10">
        {/* Left Side: Handover Interactive Editor (60% Width) */}
        <div className="w-[60%] flex flex-col h-full animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-10 bg-yellow-400 rounded-full"></div>
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter">
                  인수인계 리포트 마스터
                </h2>
                <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em] mt-0.5">
                  Interactive Handover Editor
                </p>
              </div>
            </div>
            {!handoverData && (
              <button
                onClick={handleGenerateHandover}
                disabled={isProcessing}
                className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-black shadow-xl hover:bg-black hover:scale-105 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 group"
              >
                {isProcessing ? "분석 중..." : "리포트 생성하기"}
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full group-hover:animate-ping"></div>
              </button>
            )}
          </div>
          <HandoverForm data={handoverData} onUpdate={setHandoverData} />
        </div>

        {/* Right Side: AI Assistant & Discussion (40% Width) */}
        <div className="w-[40%] flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onGenerate={handleGenerateHandover}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isProcessing={isProcessing}
            files={files}
            chatSessions={chatSessions}
            setChatSessions={setChatSessions}
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
