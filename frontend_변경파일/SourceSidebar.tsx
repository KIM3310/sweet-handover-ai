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
import { getIndexes, selectMultipleIndexes, RagIndex, getBackendUrl } from "../services/geminiService";

interface Props {
  files: SourceFile[];
  onUpload: (newFiles: SourceFile[]) => void;
  onRemove: (id: string) => void;
  onIndexChange?: (selectedIndexes: RagIndex[]) => void;  // 선택된 인덱스 변경 콜백
}

const SourceSidebar: React.FC<Props> = ({ files, onUpload, onRemove, onIndexChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // RAG 인덱스 상태
  const [ragIndexes, setRagIndexes] = useState<RagIndex[]>([]);
  const [selectedIndexNames, setSelectedIndexNames] = useState<string[]>([]);  // 멀티 선택
  const [isLoadingIndexes, setIsLoadingIndexes] = useState(false);

  // 인덱스 목록 불러오기
  const loadIndexes = async () => {
    setIsLoadingIndexes(true);
    try {
      const data = await getIndexes();
      setRagIndexes(data.indexes);
      // 기본 선택: 첫번째 인덱스
      if (data.indexes.length > 0 && selectedIndexNames.length === 0) {
        const defaultIndex = data.indexes[0].name;
        setSelectedIndexNames([defaultIndex]);
        await selectMultipleIndexes([defaultIndex]);
      }
      console.log("✅ 인덱스 목록 로드:", data.indexes.length, "개");
    } catch (error) {
      console.error("❌ 인덱스 목록 로드 실패:", error);
    } finally {
      setIsLoadingIndexes(false);
    }
  };

  // 인덱스 토글 선택 (멀티)
  const handleToggleIndex = async (indexName: string) => {
    let newSelected: string[];
    if (selectedIndexNames.includes(indexName)) {
      // 이미 선택된 경우 제거 (최소 1개는 선택)
      if (selectedIndexNames.length > 1) {
        newSelected = selectedIndexNames.filter(n => n !== indexName);
      } else {
        return; // 최소 1개는 선택되어 있어야 함
      }
    } else {
      // 선택 추가
      newSelected = [...selectedIndexNames, indexName];
    }
    
    setSelectedIndexNames(newSelected);
    
    try {
      await selectMultipleIndexes(newSelected);
      console.log("✅ 인덱스 멀티 선택됨:", newSelected);
      
      // 부모에게 선택된 인덱스 정보 전달
      if (onIndexChange) {
        const selectedIndexData = ragIndexes.filter(idx => newSelected.includes(idx.name));
        onIndexChange(selectedIndexData);
      }
    } catch (error) {
      console.error("❌ 인덱스 선택 실패:", error);
    }
  };

  // 컴포넌트 마운트 시 인덱스 목록 로드
  useEffect(() => {
    loadIndexes();
  }, []);

  // 선택된 인덱스가 변경될 때 부모에게 알림
  useEffect(() => {
    if (onIndexChange && ragIndexes.length > 0) {
      const selectedIndexData = ragIndexes.filter(idx => selectedIndexNames.includes(idx.name));
      onIndexChange(selectedIndexData);
    }
  }, [selectedIndexNames, ragIndexes]);

  // 텍스트 파일 확장자 목록
  const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.log', '.yaml', '.yml', '.ini'];
  
  const isTextFile = (fileName: string, mimeType: string): boolean => {
    const lowerName = fileName.toLowerCase();
    return mimeType.startsWith('text/') || TEXT_EXTENSIONS.some(ext => lowerName.endsWith(ext));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: SourceFile[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        let content = "";

        console.log(`📁 파일 처리 시작: ${file.name} (${file.type}, ${file.size} bytes)`);

        // 텍스트 파일은 직접 읽기
        if (isTextFile(file.name, file.type)) {
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              console.log(`✅ 텍스트 파일 읽기 완료: ${file.name} (${result.length} 글자)`);
              resolve(result);
            };
            reader.onerror = () => {
              console.error(`❌ 파일 읽기 실패: ${file.name}`);
              resolve(`[파일 읽기 실패: ${file.name}]`);
            };
            reader.readAsText(file);
          });
        } else if (
          file.type === "application/pdf" ||
          file.name.endsWith(".pdf")
        ) {
          // PDF 파일은 백엔드로 업로드 (OCR 처리)
          const formData = new FormData();
          formData.append("file", file);
          try {
            // 올바른 URL: /api/upload/upload -> /api/upload (upload router의 /upload 엔드포인트)
            const response = await fetch(`${getBackendUrl()}/api/upload/upload`, {
              method: "POST",
              body: formData,
              mode: "cors",
            });
            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ PDF 업로드 응답:", errorText);
              throw new Error(`Upload failed: ${response.status}`);
            }
            const data = await response.json();
            content = data.extracted_text || "[PDF 텍스트 추출 실패]";
            console.log("✅ PDF 텍스트 추출 완료:", file.name, `(${content.length}자)`);
          } catch (error) {
            console.error("❌ PDF 업로드 실패:", error);
            content = `[PDF 업로드 중 오류: ${error instanceof Error ? error.message : String(error)}]`;
          }
        } else {
          // 기타 파일 형식 - 파일명만 기록
          content = `[지원되지 않는 파일 형식: ${file.name}]`;
          console.warn("⚠️ 지원되지 않는 파일 형식:", file.type);
        }

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type || "application/octet-stream",
          content: content,
          mimeType: file.type || "application/octet-stream",
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
            accept=".txt,.md,.text,.pdf,.csv,.json,.xml,.html,.htm,.log,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.hwp,application/pdf,text/*"
          />
          <p className="text-[9px] text-yellow-100 mt-2 text-center">
            TXT, MD, PDF, CSV, JSON, Office 문서 지원
          </p>
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
              {ragIndexes.map((idx) => {
                const isSelected = selectedIndexNames.includes(idx.name);
                return (
                  <button
                    key={idx.name}
                    onClick={() => handleToggleIndex(idx.name)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-yellow-400 text-white shadow-sm border border-yellow-400"
                        : "bg-white text-gray-500 border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50"
                    }`}
                  >
                    <span className="truncate">{idx.name}</span>
                    <span className="flex items-center gap-1">
                      <span className={`text-[9px] ${isSelected ? 'text-yellow-100' : 'text-gray-300'}`}>
                        {idx.document_count}건
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {selectedIndexNames.length > 0 && (
            <div className="mt-2 text-[9px] text-gray-400">
              선택됨: {selectedIndexNames.length}개
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
