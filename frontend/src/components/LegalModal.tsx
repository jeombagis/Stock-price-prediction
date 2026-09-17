import React from 'react';
import { X, ShieldAlert, Scale, Database, Cpu, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="liquid-glass w-full max-w-2xl max-h-[85vh] rounded-3xl border border-white/95 bg-white/95 p-6 sm:p-7 shadow-glass-lg space-y-5 backdrop-blur-2xl relative overflow-hidden flex flex-col">
        {/* Apple Intelligence Ambient Aura */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-bl from-purple-400 via-indigo-300 to-cyan-300" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none bg-gradient-to-tr from-rose-300 to-amber-200" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 shadow-2xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                법적 고지, 저작권 및 면책 조항
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                  Legal Notice
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">자본시장법 준수, 데이터 저작권 및 상표권 공정 이용 고지</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Custom Scroll */}
        <div className="overflow-y-auto pr-2 space-y-4 text-xs text-slate-700 relative z-10 font-sans leading-relaxed">
          
          {/* Section 1: Financial Disclaimer */}
          <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>1. 금융투자 및 유사투자자문 관련 법적 면책 (자본시장법 준수)</span>
            </div>
            <p className="text-slate-600 pl-6">
              본 웹 애플리케이션(StockPredict AI)은 대한민국 「자본시장과 금융투자업에 관한 법률」에 따른 금융투자업자, 투자자문업자 또는 유사투자자문업자가 아닙니다.
            </p>
            <ul className="list-disc pl-10 space-y-1 text-slate-600 text-[11px]">
              <li>제공되는 상승/하락 확률, 예측 방향, AI 종합 의견, 기술적 분석 지표는 과거 데이터에 기반한 <strong>기계학습 알고리즘 시뮬레이션 결과</strong>이며, 특정 주식 또는 금융상품의 매수/매도를 유도하거나 권유하지 않습니다.</li>
              <li>본 서비스는 회원 또는 특정 개인을 대상으로 1:1 맞춤형 투자 조언, 자문 및 투자 일임 계약을 체결하거나 제공하지 않습니다.</li>
              <li>모든 주식 및 파생상품 투자는 <strong>원금 손실의 위험</strong>이 수반되며, 본 정보를 근거로 행한 투자 결정에 따른 모든 손익의 최종 법적·재정적 책임은 이용자 본인에게 있습니다.</li>
            </ul>
          </div>

          {/* Section 2: Market Data Copyright */}
          <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Database className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>2. 시장 데이터 출처 및 비상업적 이용 제한 (Yahoo Finance / yfinance)</span>
            </div>
            <p className="text-slate-600 pl-6">
              본 시스템에 표시되거나 모델 학습에 사용되는 과거 및 일별 주가·거래량 데이터는 오픈소스 라이브러리(yfinance)를 통해 Yahoo Finance 공개 API로부터 연동 및 캐싱됩니다.
            </p>
            <ul className="list-disc pl-10 space-y-1 text-slate-600 text-[11px]">
              <li>본 시스템의 시세 데이터는 <strong>학술 연구, 통계 분석 및 알고리즘 검증 목적</strong>으로만 제공되며, 실시간 체결 호가를 보장하지 않으며 지연 시세가 포함될 수 있습니다.</li>
              <li>데이터 공급자의 정책 및 저작권 규정에 따라, 본 시스템의 데이터 및 가공물을 상업적 용도로 무단 복제, 재판매, 재배포하는 것을 금지합니다.</li>
              <li>데이터 제공처의 서비스 중단, API 정책 변경 또는 데이터 지연/오류로 인해 발생하는 일체의 손해에 대해 본 서비스는 법적 책임을 부담하지 않습니다.</li>
            </ul>
          </div>

          {/* Section 3: Trademarks & Fair Use */}
          <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Scale className="w-4 h-4 text-cyan-600 flex-shrink-0" />
              <span>3. 상표권 및 지식재산권 공정 이용(Fair Use) 고지</span>
            </div>
            <p className="text-slate-600 pl-6">
              본 웹사이트에서 언급되는 제3자의 상표, 지수 명칭, 기업명 및 브랜드는 해당 소유권자의 등록 상표입니다.
            </p>
            <ul className="list-disc pl-10 space-y-1 text-slate-600 text-[11px]">
              <li><strong>주가지수 상표:</strong> "S&P 500®"은 Standard & Poor's Financial Services LLC의 등록 상표이며, "NASDAQ®", "NASDAQ-100®"은 The Nasdaq, Inc.의 등록 상표, "KOSPI", "KOSDAQ"은 한국거래소(KRX)의 지수 상표입니다.</li>
              <li><strong>개별 종목 티커:</strong> NVDA, TSLA, MSFT, GOOGL, AMZN, 005930.KS 등의 티커 심볼 및 기업 명칭은 해당 기업의 등록 자산이며, 자산 식별 및 통계 분석 목적으로만 공정 이용되었습니다.</li>
            </ul>
          </div>

          {/* Section 4: AI Model Limitations */}
          <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Cpu className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span>4. 인공지능(AI) 머신러닝 예측 알고리즘의 한계</span>
            </div>
            <p className="text-slate-600 pl-6">
              머신러닝 모델(XGBoost, LightGBM, Random Forest, Logistic Regression 등)은 과거 주가 시계열 및 보조지표의 상관관계를 통계적으로 모델링한 것입니다.
            </p>
            <ul className="list-disc pl-10 space-y-1 text-slate-600 text-[11px]">
              <li>예상치 못한 거시경제 충격(금리 급변, 인플레이션 등), 지정학적 리스크, 기업의 돌발 실적 공시, 규제 이슈 등 비정형적 외생 변수는 예측 모델에 즉각 반영되지 않을 수 있습니다.</li>
              <li>백테스트에서 입증된 과거의 방향 적중률(Hit Ratio)이나 Out-of-Sample 정확도는 과거 데이터에 대한 사후적 검증 결과일 뿐이며, <strong>미래의 수익이나 방향성을 보증하지 않습니다.</strong></li>
            </ul>
          </div>

          {/* Section 5: Open Source License Credits */}
          <div className="bg-white/80 p-4 rounded-2xl border border-white/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>5. 오픈소스 소프트웨어 라이선스 고지</span>
            </div>
            <p className="text-slate-600 pl-6 text-[11px]">
              본 시스템은 FastAPI(MIT), yfinance(Apache 2.0), XGBoost(Apache 2.0), LightGBM(MIT), Scikit-Learn(BSD-3-Clause), React(MIT), Recharts(MIT), Lucide React(ISC), Tailwind CSS(MIT) 등 세계적으로 검증된 오픈소스 라이브러리를 기반으로 합법적으로 구축되었습니다.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 relative z-10 flex-shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            최종 갱신일: 2026년 9월 17일 | StockPredict AI
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl text-xs font-black text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition active:scale-95"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
