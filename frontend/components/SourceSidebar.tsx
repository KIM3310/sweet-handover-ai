import React, { useRef, useState, useEffect } from "react";
import {
  Plus,
  Search,
  File,
  Trash2,
  Image as ImageIcon,
  Archive,
  Database,
  RefreshCw,
  Check,
} from "lucide-react";
import { SourceFile } from "../types";
import { getIndexes, RagIndex, getBackendUrl } from "../services/geminiService";

interface Props {
  files: SourceFile[];
  onUpload: (newFiles: SourceFile[]) => void;
  onRemove: (id: string) => void;
  selectedIndexes: string[];
  onSelectIndexes: (indexes: string[]) => void;
}

const SourceSidebar: React.FC<Props> = ({
  files,
  onUpload,
  onRemove,
  selectedIndexes,
  onSelectIndexes,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RAG 인덱스 상태
  const [ragIndexes, setRagIndexes] = useState<RagIndex[]>([]);
  const [isLoadingIndexes, setIsLoadingIndexes] = useState(false);

  // 인덱스 목록 불러오기
  const loadIndexes = async () => {
    setIsLoadingIndexes(true);
    try {
      const data = await getIndexes();
      setRagIndexes(data.indexes);
      if (selectedIndexes.length === 0 && data.current_index) {
        onSelectIndexes([data.current_index]);
      }
      console.log("✅ 인덱스 목록 로드:", data.indexes.length, "개");
    } catch (error) {
      console.error("❌ 인덱스 목록 로드 실패:", error);
    } finally {
      setIsLoadingIndexes(false);
    }
  };

  // 인덱스 선택 (다중 선택)
  const handleSelectIndex = (indexName: string) => {
    if (selectedIndexes.includes(indexName)) {
      onSelectIndexes(selectedIndexes.filter((name) => name !== indexName));
      return;
    }
    onSelectIndexes([...selectedIndexes, indexName]);
  };

  // 컴포넌트 마운트 시 인덱스 목록 로드
  useEffect(() => {
    loadIndexes();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: SourceFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        let content = "";

        // 텍스트 파일은 직접 읽기
        let needsUpload = false;

        if (
          file.type === "text/plain" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md")
        ) {
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.readAsText(file);
          });
          needsUpload = true;
        } else if (
          file.type === "application/pdf" ||
          file.name.endsWith(".pdf")
        ) {
          // PDF 파일은 백엔드로 업로드 (OCR 처리)
          const formData = new FormData();
          formData.append("file", file);
          const indexParam =
            selectedIndexes.length > 0
              ? `?index_names=${encodeURIComponent(selectedIndexes.join(","))}`
              : "";
          try {
            const response = await fetch(
              `${getBackendUrl()}/api/upload/upload${indexParam}`,
              {
              method: "POST",
              body: formData,
              }
            );
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }
            const data = await response.json();
            content = data.extracted_text || "[PDF 텍스트 추출 실패]";
            console.log("✅ PDF 텍스트 추출 완료:", file.name);
          } catch (error) {
            console.error("❌ PDF 업로드 실패:", error);
            content = "[PDF 업로드 중 오류 발생]";
          }
        } else {
          needsUpload = true;
        }

        if (needsUpload) {
          // 기타 파일도 백엔드로 업로드하여 인덱싱
          const formData = new FormData();
          formData.append("file", file);
          const indexParam =
            selectedIndexes.length > 0
              ? `?index_names=${encodeURIComponent(selectedIndexes.join(","))}`
              : "";
          try {
            const response = await fetch(
              `${getBackendUrl()}/api/upload/upload${indexParam}`,
              {
                method: "POST",
                body: formData,
              }
            );
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }
            const data = await response.json();
            content = data.extracted_text || content;
            console.log("✅ 파일 인덱싱 완료:", file.name);
          } catch (error) {
            console.error("❌ 파일 업로드 실패:", error);
            content = content || "[파일 업로드 중 오류 발생]";
          }
        }

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          content: content,
          mimeType: file.type,
        });
      }
      onUpload(newFiles);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <div className="w-80 h-full bg-white border-r flex flex-col p-5 shadow-sm relative overflow-hidden">
      <div className="mb-8 flex items-center gap-3 relative z-10">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 border-2 border-yellow-500">
          <span className="text-2xl">🍯</span>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
            꿀단지
          </h1>
          <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest">
            Sweet Handover AI
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-5 relative z-10">
        <div className="bg-yellow-400 rounded-2xl p-5 text-white shadow-md border-b-4 border-yellow-500">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Archive className="w-4 h-4" /> 자료 보관함
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white text-yellow-600 hover:bg-yellow-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            자료 추가하기
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept=".txt,.md,.text,.pdf,application/pdf"
          />
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 w-4 h-4" />
          <input
            type="text"
            placeholder="자료 검색..."
            className="w-full pl-11 pr-4 py-3 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all placeholder:text-yellow-300"
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 px-2">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-yellow-500 transition-colors">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span>웹 검색</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-yellow-500 transition-colors">
            <span className="w-2 h-2 rounded-full bg-gray-200"></span>
            <span>심층 분석</span>
          </div>
        </div>

        {/* RAG 지식보관소 선택 (서버에서 인덱스 목록 로드) */}
        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-yellow-500" /> 지식보관소 선택
            <span className="ml-1 text-[9px] text-gray-300">(다중 선택)</span>
            <button
              onClick={loadIndexes}
              disabled={isLoadingIndexes}
              className="ml-auto p-1 hover:bg-yellow-100 rounded transition-all"
              title="새로고침"
            >
              <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoadingIndexes ? 'animate-spin' : ''}`} />
            </button>
          </h3>

          {isLoadingIndexes ? (
            <div className="text-center py-2 text-xs text-gray-400">
              로딩 중...
            </div>
          ) : ragIndexes.length === 0 ? (
            <div className="text-center py-2 text-xs text-gray-400">
              인덱스가 없습니다
            </div>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {ragIndexes.map((idx) => (
                <button
                  key={idx.name}
                  onClick={() => handleSelectIndex(idx.name)}
                  className={`w-full px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                    selectedIndexes.includes(idx.name)
                      ? "bg-yellow-400 text-white shadow-sm border border-yellow-400"
                      : "bg-white text-gray-500 border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50"
                  }`}
                >
                  <span className="truncate">{idx.name}</span>
                  <span className="flex items-center gap-1">
                    <span className={`text-[9px] ${selectedIndexes.includes(idx.name) ? 'text-yellow-100' : 'text-gray-300'}`}>
                      {idx.document_count}건
                    </span>
                    {selectedIndexes.includes(idx.name) && (
                      <Check className="w-3 h-3" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
          {files.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="text-4xl mb-4 grayscale opacity-30">🐝</div>
              <p className="text-gray-400 text-sm font-medium">
                아직 저장된 자료가 없어요.
              </p>
              <p className="text-gray-300 text-xs mt-1">
                업무 매뉴얼이나 보고서를
                <br />
                추가해 보세요!
              </p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-3 p-3 bg-gray-50 hover:bg-yellow-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-yellow-100 shadow-sm hover:shadow-md"
              >
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                  {isImage(file.mimeType) ? (
                    <ImageIcon className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <File className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-yellow-500 font-bold uppercase">
                    {file.type.split("/")[1] || "FILE"}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceSidebar;
