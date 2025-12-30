import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  MessageSquare,
  Wand2,
  Sparkles,
  Loader2,
  Info,
  Trash2,
} from "lucide-react";
import { ChatMessage, ViewMode, SourceFile, ChatSession } from "../types";
import { getBackendUrl, RagIndex } from "../services/geminiService";

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onGenerate: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isProcessing: boolean;
  files: SourceFile[];
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[]) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  selectedIndexes?: RagIndex[];
}

interface Stats {
  total_documents: number;
  recent_uploads: number;
  selected_indexes?: number;
  status: string;
}

const ChatWindow: React.FC<Props> = ({
  messages,
  onSendMessage,
  onGenerate,
  viewMode,
  setViewMode,
  isProcessing,
  files,
  chatSessions,
  setChatSessions,
  currentSessionId,
  setCurrentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  selectedIndexes = [],
}) => {
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<Stats>({
    total_documents: 0,
    recent_uploads: 0,
    selected_indexes: 0,
    status: "⏳ 연결중...",
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 통계 조회 및 연결 상태 확인
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/upload/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setIsConnected(true);
          console.log("📊 시스템 통계:", data);
        } else {
          setIsConnected(false);
          setStats((prev) => ({ ...prev, status: "⚠️ 서버 오류" }));
        }
      } catch (error) {
        console.error("❌ 통계 조회 실패:", error);
        setIsConnected(false);
        setStats((prev) => ({ ...prev, status: "❌ 연결 끊김" }));
      }
    };

    fetchStats();
    // 10초마다 갱신 (서버 부하 감소)
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-yellow-100 relative">
      {/* 시스템 상태바 (요청하신 상단 바) */}
      <div className="bg-gradient-to-r from-yellow-50 to-white px-5 py-2 border-b border-yellow-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConnected === true 
                ? "bg-green-500 animate-pulse" 
                : isConnected === false 
                  ? "bg-red-500" 
                  : "bg-yellow-500 animate-pulse"
            }`}></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              {isConnected === true ? "System Live" : isConnected === false ? "Disconnected" : "Connecting..."}
            </span>
          </div>
          {/* 선택된 인덱스 표시 */}
          {selectedIndexes.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-black text-purple-600">
              <span className="opacity-50 text-gray-400">활성 인덱스</span>
              <span className="bg-purple-100 px-1.5 py-0.5 rounded-md max-w-[150px] truncate" title={selectedIndexes.map(i => i.name).join(', ')}>
                {selectedIndexes.length === 1 
                  ? selectedIndexes[0].name 
                  : `${selectedIndexes[0].name} 외 ${selectedIndexes.length - 1}개`}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black">
          <div className="flex items-center gap-1 text-yellow-600">
            <span className="opacity-50 text-gray-400">업로드 파일</span>
            <span className="bg-yellow-100 px-1.5 py-0.5 rounded-md">
              {files.length}건
            </span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <span className="opacity-50 text-gray-400">인덱스 문서</span>
            <span className="bg-blue-50 px-1.5 py-0.5 rounded-md">
              {selectedIndexes.length > 0 
                ? `${selectedIndexes.reduce((sum, idx) => sum + idx.document_count, 0)}개`
                : `${stats.total_documents}개`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-4 border-b border-yellow-50 bg-white/80 backdrop-blur-md">
        <h2 className="font-extrabold text-gray-800 flex items-center gap-2">
          {viewMode === ViewMode.CHAT ? (
            <>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-yellow-600" />
              </div>{" "}
              인수인계 챗봇
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-blue-600" />
              </div>{" "}
              채팅방
            </>
          )}
        </h2>
        <div className="flex gap-3 items-center">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode(ViewMode.CHAT)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === ViewMode.CHAT
                  ? "bg-white text-yellow-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              채팅
            </button>
            <button
              onClick={() => setViewMode(ViewMode.CHAT_HISTORY)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === ViewMode.CHAT_HISTORY
                  ? "bg-white text-yellow-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              채팅방
            </button>
          </div>
          {viewMode === ViewMode.CHAT && messages.length > 0 && (
            <button
              onClick={onNewChat}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all active:scale-95"
            >
              + 새 채팅
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FFFEFA]"
      >
        {viewMode === ViewMode.CHAT ? (
          // 채팅 모드
          <>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                  <Sparkles className="w-12 h-12 text-yellow-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-3">
                  달콤한 인수인계 가이드
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium">
                  업로드하신 파일을 분석하여
                  <br />
                  완벽한 인수인계서를 만들어 드릴게요.
                  <br />
                  <span className="text-yellow-600">
                    왼쪽 보관함에 자료를 먼저 넣어주세요!
                  </span>
                </p>
                <button
                  onClick={onGenerate}
                  disabled={isProcessing}
                  className="w-full bg-yellow-400 text-white py-4 rounded-2xl font-black shadow-xl shadow-yellow-100 hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mb-3"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Wand2 className="w-6 h-6" />
                  )}
                  인수인계서 생성하기
                </button>
                <button
                  onClick={onNewChat}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-300 transition-all active:scale-95"
                >
                  📝 새 채팅 시작
                </button>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-3.5 shadow-sm border ${
                      msg.role === "user"
                        ? "bg-yellow-400 border-yellow-500 text-white font-bold rounded-tr-none"
                        : "bg-white border-yellow-100 text-gray-700 font-medium rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-yellow-100 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-xs text-yellow-600 font-bold italic">
                    자료를 달콤하게 분석 중...
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          // 채팅방(히스토리) 모드
          <div className="flex flex-col gap-4">
            {chatSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">
                  채팅 기록이 없어요
                </h3>
                <p className="text-gray-500 text-sm">
                  왼쪽 채팅 탭에서 시작한 대화가
                  <br />
                  여기에 저장됩니다.
                </p>
              </div>
            ) : (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                    currentSessionId === session.id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-gray-50 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div onClick={() => onSelectSession(session.id)}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-800 line-clamp-2 pr-8">
                        {session.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {new Date(session.updatedAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 line-clamp-2">
                      {session.messages[session.messages.length - 1]?.text ||
                        "내용이 없습니다"}
                    </p>
                    <div className="text-[10px] text-gray-400 mt-2">
                      메시지 {session.messages.length}개
                    </div>
                  </div>
                  {/* 삭제 버튼 */}
                  {onDeleteSession && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("이 채팅 기록을 삭제하시겠습니까?")) {
                          onDeleteSession(session.id);
                        }
                      }}
                      className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="채팅 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-5 bg-white border-t border-yellow-50">
        <form onSubmit={handleSubmit} className="relative mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="인수인계 자료에 대해 궁금한 점을 물어보세요..."
            className="w-full pl-5 pr-14 py-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-300 outline-none transition-all placeholder:text-yellow-300"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-yellow-400 text-white rounded-xl hover:bg-yellow-500 transition-all shadow-md disabled:opacity-50 active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold">
          <Info className="w-3 h-3" />
          꿀단지는 AI 기술을 사용하여 인수인계서를 보조합니다.
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
