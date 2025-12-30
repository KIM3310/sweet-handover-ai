
import React, { useState } from 'react';
import { LogIn, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제 운영 환경에서는 서버 인증 로직이 들어갑니다.
    if (id && pw) {
      onLogin();
    } else {
      alert('아이디와 비밀번호를 입력해 주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="honeycomb-bg"></div>
      
      {/* Floating Elements for Decoration */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(252,211,77,0.2)] border border-white relative z-10 animate-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-6 mb-6 group hover:rotate-0 transition-all duration-500">
             <span className="text-4xl group-hover:scale-125 transition-transform">🍯</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter">꿀단지 접속하기</h1>
          <p className="text-sm font-bold text-yellow-600 mt-2">당신의 업무를 가장 달콤하게 이어주는 AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">사번 또는 ID</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="ID를 입력하세요"
              className="w-full px-6 py-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-300 outline-none transition-all font-bold placeholder:text-yellow-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
            <input 
              type="password" 
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-300 outline-none transition-all font-bold placeholder:text-yellow-200"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            로그인
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-yellow-50 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            보안된 사내 망을 통해 안전하게 접속 중입니다.
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Gemini 3 Pro 엔진이 실시간 분석을 지원합니다.
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-[10px] font-black text-yellow-600/30 uppercase tracking-[1em]">
        Kkuldanji AI Handover System
      </div>
    </div>
  );
};

export default LoginScreen;
