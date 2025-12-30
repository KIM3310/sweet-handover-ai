import React, { useState } from "react";
import { HandoverData } from "../types";
import {
  FileText,
  Users,
  Briefcase,
  ListTodo,
  Layers,
  Key,
  CheckSquare,
  Sparkles,
  AlertTriangle,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Printer,
  Save,
  Download,
} from "lucide-react";

interface Props {
  data: HandoverData | null;
  onUpdate: (data: HandoverData) => void;
}

const HandoverForm: React.FC<Props> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!data) {
    return (
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-yellow-200 flex flex-col items-center justify-center p-12 text-center h-full animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-yellow-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner animate-bounce">
          <Sparkles className="w-12 h-12 text-yellow-500" />
        </div>
        <h3 className="text-xl font-black text-gray-800">
          새로운 꿀단지가 비어있어요
        </h3>
        <p className="text-gray-400 mt-2 text-xs font-bold leading-relaxed">
          오른쪽 보관함에 자료를 넣고 '리포트 생성'을 눌러주세요.
          <br />
          AI가 분석한 인수인계서가 이곳에 나타납니다.
        </p>
      </div>
    );
  }

  const handleChange = (path: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    const keys = path.split(".");
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onUpdate(newData);
  };

  const addItem = (path: string, defaultItem: any) => {
    const newData = JSON.parse(JSON.stringify(data));
    const keys = path.split(".");
    let current: any = newData;
    for (const key of keys) current = current[key];
    current.push(defaultItem);
    onUpdate(newData);
  };

  const removeItem = (path: string, index: number) => {
    const newData = JSON.parse(JSON.stringify(data));
    const keys = path.split(".");
    let current: any = newData;
    for (const key of keys) current = current[key];
    current.splice(index, 1);
    onUpdate(newData);
  };

  const tabs = [
    { name: "1. 개요", icon: <FileText className="w-4 h-4" /> },
    { name: "2. 직무", icon: <Briefcase className="w-4 h-4" /> },
    { name: "3. 과제", icon: <ListTodo className="w-4 h-4" /> },
    { name: "4. 현황", icon: <Layers className="w-4 h-4" /> },
    { name: "5. 자료", icon: <Key className="w-4 h-4" /> },
    { name: "6. 확인", icon: <CheckSquare className="w-4 h-4" /> },
  ];

  const InputField = ({
    label,
    value,
    onChange,
    multiline = false,
    placeholder = "",
  }: any) => (
    <div className="mb-4 group">
      <label className="block text-[9px] font-black text-yellow-600 uppercase mb-1.5 tracking-widest">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3.5 bg-white border border-yellow-100 rounded-xl focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-300 outline-none transition-all text-xs font-medium min-h-[100px] shadow-sm resize-none"
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3.5 bg-white border border-yellow-100 rounded-xl focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-300 outline-none transition-all text-xs font-bold shadow-sm"
        />
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-yellow-100 h-full flex flex-col overflow-hidden relative">
      {/* Tab Navigation */}
      <div className="flex bg-yellow-50/50 border-b border-yellow-100 p-2 gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-black transition-all rounded-xl whitespace-nowrap ${
              activeTab === idx
                ? "bg-white text-yellow-600 shadow-md ring-1 ring-yellow-100"
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
            }`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-gradient-to-b from-white to-yellow-50/10">
        {/* Tab 1: 개요 */}
        {activeTab === 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-sm relative overflow-hidden group/card">
                <h3 className="text-[10px] font-black text-amber-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <ChevronRight className="w-3 h-3" /> 인계자 정보
                </h3>
                <InputField
                  label="이름"
                  value={data.overview.transferor.name}
                  onChange={(v: any) =>
                    handleChange("overview.transferor.name", v)
                  }
                />
                <InputField
                  label="직급/부서"
                  value={data.overview.transferor.position}
                  onChange={(v: any) =>
                    handleChange("overview.transferor.position", v)
                  }
                />
                <InputField
                  label="연락처"
                  value={data.overview.transferor.contact}
                  onChange={(v: any) =>
                    handleChange("overview.transferor.contact", v)
                  }
                />
              </div>
              <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 shadow-sm relative overflow-hidden group/card">
                <h3 className="text-[10px] font-black text-orange-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <ChevronRight className="w-3 h-3" /> 인수자 정보
                </h3>
                <InputField
                  label="이름"
                  value={data.overview.transferee.name}
                  onChange={(v: any) =>
                    handleChange("overview.transferee.name", v)
                  }
                />
                <InputField
                  label="직급/부서"
                  value={data.overview.transferee.position}
                  onChange={(v: any) =>
                    handleChange("overview.transferee.position", v)
                  }
                />
                <InputField
                  label="부임 예정일"
                  value={data.overview.transferee.startDate}
                  onChange={(v: any) =>
                    handleChange("overview.transferee.startDate", v)
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <InputField
                label="인계 사유"
                value={data.overview.reason}
                multiline
                onChange={(v: any) => handleChange("overview.reason", v)}
              />
              <InputField
                label="배경 및 배경 정보"
                value={data.overview.background}
                multiline
                onChange={(v: any) => handleChange("overview.background", v)}
              />
              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="인계 기간"
                  value={data.overview.period}
                  onChange={(v: any) => handleChange("overview.period", v)}
                  placeholder="YYYY.MM.DD ~ YYYY.MM.DD"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 직무 */}
        {activeTab === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-white border border-blue-50 rounded-[2.5rem] shadow-sm">
              <InputField
                label="공식 직무명"
                value={data.jobStatus.title}
                onChange={(v: any) => handleChange("jobStatus.title", v)}
              />
              <InputField
                label="핵심 책임 (엔터로 구분)"
                value={data.jobStatus.responsibilities.join("\n")}
                multiline
                onChange={(v: any) =>
                  handleChange("jobStatus.responsibilities", v.split("\n"))
                }
              />
              <div className="grid grid-cols-2 gap-6">
                <InputField
                  label="의사결정 권한"
                  value={data.jobStatus.authority}
                  onChange={(v: any) => handleChange("jobStatus.authority", v)}
                />
                <InputField
                  label="보고 체계"
                  value={data.jobStatus.reportingLine}
                  onChange={(v: any) =>
                    handleChange("jobStatus.reportingLine", v)
                  }
                />
              </div>
            </div>

            <div className="p-8 bg-yellow-400 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden group/mission">
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-all duration-1000">
                <Sparkles className="w-48 h-48" />
              </div>
              <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 팀 전략 및 목표
              </h3>
              <InputField
                label="팀 미션"
                value={data.jobStatus.teamMission}
                onChange={(v: any) => handleChange("jobStatus.teamMission", v)}
              />
              <InputField
                label="현재 핵심 목표"
                value={data.jobStatus.teamGoals.join("\n")}
                multiline
                onChange={(v: any) =>
                  handleChange("jobStatus.teamGoals", v.split("\n"))
                }
              />
            </div>
          </div>
        )}

        {/* Tab 3: 과제 */}
        {activeTab === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" /> 최우선 과제 (Top 3
                  Priorities)
                </h3>
              </div>
              <div className="grid gap-4">
                {data.priorities.map((p, i) => (
                  <div
                    key={i}
                    className="p-6 bg-white border border-red-50 rounded-3xl shadow-sm flex items-start gap-6 group/item hover:shadow-md transition-all relative"
                  >
                    <span className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">
                      {i + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-12 gap-6">
                      <div className="col-span-6">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                          과제명
                        </label>
                        <input
                          className="w-full text-xs font-black text-gray-800 outline-none bg-transparent"
                          value={p.title}
                          onChange={(e) => {
                            const next = [...data.priorities];
                            next[i].title = e.target.value;
                            handleChange("priorities", next);
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                          상태
                        </label>
                        <input
                          className="w-full text-[10px] font-bold text-gray-500 outline-none bg-transparent"
                          value={p.status}
                          onChange={(e) => {
                            const next = [...data.priorities];
                            next[i].status = e.target.value;
                            handleChange("priorities", next);
                          }}
                        />
                      </div>
                      <div className="col-span-3 text-right">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                          기한
                        </label>
                        <input
                          className="w-full text-[10px] font-black text-red-500 outline-none bg-transparent text-right"
                          value={p.deadline}
                          onChange={(e) => {
                            const next = [...data.priorities];
                            next[i].deadline = e.target.value;
                            handleChange("priorities", next);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 relative group/section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black text-gray-700 tracking-widest uppercase">
                    핵심 관계자
                  </h3>
                  <button
                    onClick={() =>
                      addItem("stakeholders.internal", {
                        name: "이름",
                        role: "역할",
                      })
                    }
                    className="p-1.5 bg-white rounded-lg text-gray-400 hover:text-yellow-600 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {data.stakeholders.internal.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 group/row"
                    >
                      <div className="flex-1">
                        <input
                          className="w-full text-[11px] font-black text-gray-800 outline-none"
                          value={s.name}
                          onChange={(e) => {
                            const next = [...data.stakeholders.internal];
                            next[i].name = e.target.value;
                            handleChange("stakeholders.internal", next);
                          }}
                        />
                        <input
                          className="w-full text-[9px] font-bold text-gray-400 outline-none"
                          value={s.role}
                          onChange={(e) => {
                            const next = [...data.stakeholders.internal];
                            next[i].role = e.target.value;
                            handleChange("stakeholders.internal", next);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => removeItem("stakeholders.internal", i)}
                        className="opacity-0 group-hover/row:opacity-100 p-1.5 text-red-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 relative group/section">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black text-blue-800 tracking-widest uppercase">
                    팀 구성원
                  </h3>
                  <button
                    onClick={() =>
                      addItem("teamMembers", {
                        name: "이름",
                        position: "직급",
                        role: "역할",
                        notes: "",
                      })
                    }
                    className="p-1.5 bg-white rounded-lg text-blue-400 hover:text-blue-600 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {data.teamMembers.map((m, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-xl shadow-sm border border-blue-100 group/row"
                    >
                      <div className="flex justify-between items-start">
                        <input
                          className="w-full text-[11px] font-black text-gray-800 outline-none"
                          value={`${m.name} (${m.position})`}
                          onChange={(e) => {
                            const next = [...data.teamMembers];
                            next[i].name = e.target.value;
                            handleChange("teamMembers", next);
                          }}
                        />
                        <button
                          onClick={() => removeItem("teamMembers", i)}
                          className="opacity-0 group-hover/row:opacity-100 p-1.5 text-red-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        className="w-full text-[9px] font-bold text-blue-500 outline-none"
                        value={m.role}
                        onChange={(e) => {
                          const next = [...data.teamMembers];
                          next[i].role = e.target.value;
                          handleChange("teamMembers", next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: 현황 */}
        {activeTab === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-gray-500 tracking-widest uppercase">
                프로젝트 진행 로드맵
              </h3>
              <button
                onClick={() =>
                  addItem("ongoingProjects", {
                    name: "새 프로젝트",
                    owner: "담당",
                    status: "진행",
                    progress: 0,
                    deadline: "YYYY.MM.DD",
                    description: "",
                  })
                }
                className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 hover:text-indigo-700 transition-all"
              >
                <Plus className="w-3 h-3" /> 추가
              </button>
            </div>
            <div className="grid gap-4">
              {data.ongoingProjects.map((p, i) => (
                <div
                  key={i}
                  className="p-6 bg-white border border-indigo-50 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group/item"
                >
                  <button
                    onClick={() => removeItem("ongoingProjects", i)}
                    className="absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        className="text-sm font-black text-gray-800 outline-none bg-transparent"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...data.ongoingProjects];
                          next[i].name = e.target.value;
                          handleChange("ongoingProjects", next);
                        }}
                      />
                      <input
                        className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full outline-none"
                        value={p.owner}
                        onChange={(e) => {
                          const next = [...data.ongoingProjects];
                          next[i].owner = e.target.value;
                          handleChange("ongoingProjects", next);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        className="w-10 text-right text-xs font-black text-indigo-600 outline-none bg-transparent"
                        value={p.progress}
                        onChange={(e) => {
                          const next = [...data.ongoingProjects];
                          next[i].progress = Math.min(
                            100,
                            Math.max(0, parseInt(e.target.value) || 0)
                          );
                          handleChange("ongoingProjects", next);
                        }}
                      />
                      <span className="text-xs font-black text-indigo-600">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-4 shadow-inner">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-1000"
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="진행 상황 / 기한"
                      value={`${p.status} / ${p.deadline}`}
                      onChange={(v: any) => {
                        const next = [...data.ongoingProjects];
                        const parts = v.split(" / ");
                        next[i].status = parts[0];
                        if (parts[1]) next[i].deadline = parts[1];
                        handleChange("ongoingProjects", next);
                      }}
                    />
                    <InputField
                      label="상세 내용"
                      value={p.description}
                      onChange={(v: any) => {
                        const next = [...data.ongoingProjects];
                        next[i].description = v;
                        handleChange("ongoingProjects", next);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 relative group/risk overflow-hidden shadow-inner">
              <h3 className="text-xs font-black text-red-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 주요 이슈 및 리스크
              </h3>
              <InputField
                label="현재 이슈"
                value={data.risks.issues}
                multiline
                onChange={(v: any) => handleChange("risks.issues", v)}
              />
              <InputField
                label="잠재적 리스크"
                value={data.risks.risks}
                multiline
                onChange={(v: any) => handleChange("risks.risks", v)}
              />
            </div>
          </div>
        )}

        {/* Tab 5: 자료 */}
        {activeTab === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 group/section shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-emerald-800 tracking-widest uppercase">
                    참고 문서 정보
                  </h3>
                  <button
                    onClick={() =>
                      addItem("resources.docs", {
                        category: "분류",
                        name: "문서명",
                        location: "경로",
                      })
                    }
                    className="p-1.5 bg-white rounded-lg text-emerald-400 hover:text-emerald-600 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {data.resources.docs.map((d, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-xl shadow-sm text-[10px] border border-emerald-50 group/row"
                    >
                      <div className="flex justify-between mb-1">
                        <input
                          className="text-emerald-600 font-black outline-none bg-transparent"
                          value={`[${d.category}]`}
                          onChange={(e) => {
                            const next = [...data.resources.docs];
                            next[i].category = e.target.value.replace(
                              /[\[\]]/g,
                              ""
                            );
                            handleChange("resources.docs", next);
                          }}
                        />
                        <button
                          onClick={() => removeItem("resources.docs", i)}
                          className="opacity-0 group-hover/row:opacity-100 text-red-300 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        className="w-full font-black text-gray-800 outline-none mb-0.5"
                        value={d.name}
                        onChange={(e) => {
                          const next = [...data.resources.docs];
                          next[i].name = e.target.value;
                          handleChange("resources.docs", next);
                        }}
                      />
                      <input
                        className="w-full text-gray-400 italic outline-none truncate"
                        value={d.location}
                        onChange={(e) => {
                          const next = [...data.resources.docs];
                          next[i].location = e.target.value;
                          handleChange("resources.docs", next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-teal-50 rounded-[2.5rem] border border-teal-100 group/section shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black text-teal-800 tracking-widest uppercase">
                    시스템 접근 권한
                  </h3>
                  <button
                    onClick={() =>
                      addItem("resources.systems", {
                        name: "시스템",
                        usage: "용도",
                        contact: "문의",
                      })
                    }
                    className="p-1.5 bg-white rounded-lg text-teal-400 hover:text-teal-600 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {data.resources.systems.map((s, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-xl shadow-sm text-[10px] border border-teal-50 group/row"
                    >
                      <div className="flex justify-between mb-1">
                        <input
                          className="font-black text-gray-800 outline-none"
                          value={s.name}
                          onChange={(e) => {
                            const next = [...data.resources.systems];
                            next[i].name = e.target.value;
                            handleChange("resources.systems", next);
                          }}
                        />
                        <button
                          onClick={() => removeItem("resources.systems", i)}
                          className="opacity-0 group-hover/row:opacity-100 text-red-300 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        className="w-full text-teal-600 font-bold outline-none mb-0.5"
                        value={s.usage}
                        onChange={(e) => {
                          const next = [...data.resources.systems];
                          next[i].usage = e.target.value;
                          handleChange("resources.systems", next);
                        }}
                      />
                      <input
                        className="w-full text-gray-400 italic outline-none"
                        value={`문의: ${s.contact}`}
                        onChange={(e) => {
                          const next = [...data.resources.systems];
                          next[i].contact = e.target.value.replace(
                            "문의: ",
                            ""
                          );
                          handleChange("resources.systems", next);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: 확인 */}
        {activeTab === 5 && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="p-10 bg-yellow-400 text-white rounded-[3rem] text-center shadow-2xl relative overflow-hidden ring-[1rem] ring-yellow-400/20">
              <div className="absolute top-0 right-0 p-8 opacity-10 animate-pulse">
                <Sparkles className="w-48 h-48" />
              </div>
              <p className="text-lg font-black italic mb-10 leading-relaxed">
                "본 인수인계서의 모든 내용에 대해 인계자로부터 충분한 설명을
                들었으며,
                <br />
                관련 자료를 전달받았음을 공식적으로 확인합니다."
              </p>

              <div className="grid grid-cols-3 gap-10 pt-10 border-t border-white/30">
                <div className="group/sig">
                  <div className="h-16 border-b-2 border-dashed border-white/50 flex items-end justify-center pb-2 text-sm font-black transition-all">
                    {data.overview.transferor.name}
                  </div>
                  <span className="text-[9px] font-black mt-2 block opacity-70 uppercase tracking-widest">
                    인계자
                  </span>
                </div>
                <div className="group/sig">
                  <div className="h-16 border-b-2 border-dashed border-white/50 flex items-end justify-center pb-2 text-sm font-black transition-all">
                    {data.overview.transferee.name}
                  </div>
                  <span className="text-[9px] font-black mt-2 block opacity-70 uppercase tracking-widest">
                    인수자
                  </span>
                </div>
                <div className="group/sig">
                  <div className="h-16 border-b-2 border-dashed border-white/50 flex items-end justify-center pb-2 text-xs font-black text-white/40 italic">
                    (서명)
                  </div>
                  <span className="text-[9px] font-black mt-2 block opacity-70 uppercase tracking-widest">
                    일자: {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-yellow-100 shadow-sm relative group/check">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-yellow-600 flex items-center gap-2 uppercase tracking-widest">
                  <Download className="w-4 h-4" /> 최종 확인 체크리스트
                </h3>
                <button
                  onClick={() =>
                    addItem("checklist", {
                      text: "추가 사항",
                      completed: false,
                    })
                  }
                  className="text-[9px] font-black text-yellow-500 hover:text-yellow-600"
                >
                  + 항목 추가
                </button>
              </div>
              <div className="space-y-3">
                {data.checklist.map((c, i) => (
                  <div
                    key={i}
                    className={`group/row flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      c.completed
                        ? "bg-yellow-50 border-yellow-200 shadow-inner"
                        : "bg-gray-50 border-gray-100 hover:border-yellow-200"
                    }`}
                    onClick={() => {
                      const next = [...data.checklist];
                      next[i].completed = !next[i].completed;
                      handleChange("checklist", next);
                    }}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        c.completed
                          ? "bg-yellow-400 border-yellow-400 text-white shadow-lg"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {c.completed && <CheckSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <input
                        className={`w-full text-xs font-black outline-none bg-transparent transition-all ${
                          c.completed
                            ? "text-yellow-700/40 line-through"
                            : "text-gray-700"
                        }`}
                        value={c.text}
                        onChange={(e) => {
                          const next = [...data.checklist];
                          next[i].text = e.target.value;
                          handleChange("checklist", next);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem("checklist", i);
                      }}
                      className="opacity-0 group-hover/row:opacity-100 p-1.5 text-red-200 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pb-8">
              <button
                onClick={() => window.print()}
                className="flex-1 py-6 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group/btn"
              >
                <Printer className="w-5 h-5 group-hover/btn:animate-bounce" />
                리포트 출력 및 PDF 저장
              </button>
              <button className="px-10 py-6 bg-white border-2 border-yellow-400 text-yellow-500 rounded-[1.5rem] font-black text-sm hover:bg-yellow-50 transition-all flex items-center justify-center gap-3">
                <Save className="w-5 h-5" /> 임시 저장
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Honey Progress Indicator */}
      <div className="bg-yellow-400 h-1.5 w-full">
        <div
          className="bg-white/40 h-full transition-all duration-500"
          style={{ width: `${((activeTab + 1) / tabs.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default HandoverForm;
