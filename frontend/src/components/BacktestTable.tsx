import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle, Award, Target, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { BacktestSummaryResponse } from '../types';
import { api } from '../services/api';

interface BacktestTableProps {
  assetKey: string;
  refreshKey?: number;
}

export const BacktestTable: React.FC<BacktestTableProps> = ({ assetKey, refreshKey }) => {
  const [days, setDays] = useState<number>(20);
  const [data, setData] = useState<BacktestSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const loadBacktest = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBacktest(assetKey, days, signal);
      if (signal?.aborted) return;
      setData(res);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Failed to load backtest data:", err);
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadBacktest(controller.signal);
    return () => controller.abort();
  }, [assetKey, days, refreshKey]);

  return (
    <div className="glass-panel !rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black/[0.04] text-[#0071e3] flex items-center justify-center border border-black/[0.04]">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1d1d1f] tracking-tight">과거 예측 vs 실제 시장 결과 백테스트</h2>
          </div>
          <span className="text-xs text-[#86868b] font-semibold">({data?.asset_name})</span>
        </div>

        {/* Days Filter Segmented Track */}
        <div className="segmented-track">
          {[10, 20, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`segmented-btn !py-1 !px-2.5 text-xs ${days === d ? 'selected' : ''}`}
            >
              최근 {d}일
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="liquid-glass-card p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0071e3]/[0.08] text-[#0071e3] flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#86868b]">방향 적중률 (Hit Ratio)</div>
              <div className="text-lg font-bold text-[#1d1d1f]">
                {data.hit_ratio_pct}% <span className="text-xs font-normal text-[#86868b]">({data.hit_count}/{data.total_days})</span>
              </div>
            </div>
          </div>

          <div className="liquid-glass-card p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#059669]/[0.08] text-[#059669] flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#86868b]">Out-of-Sample 정확도</div>
              <div className="text-lg font-bold text-[#059669]">
                {(data.out_of_sample_acc * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="liquid-glass-card p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0284c7]/[0.08] text-[#0284c7] flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#86868b]">Macro F1 Score</div>
              <div className="text-lg font-bold text-[#0284c7]">
                {data.out_of_sample_f1.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="liquid-glass-card p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9333ea]/[0.08] text-[#9333ea] flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#86868b]">마스터 기준</div>
              <div className="text-sm font-bold text-[#1d1d1f] mt-0.5">
                앙상블 Soft Voting {data.thresholds?.Ensemble != null ? `(${(data.thresholds.Ensemble * 100).toFixed(1)}%)` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {loading ? (
        <div className="h-44 flex items-center justify-center text-xs text-[#86868b]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-[#515154]">백테스트 히스토리 로드 중...</span>
          </div>
        </div>
      ) : error ? (
        <div className="h-44 flex flex-col items-center justify-center text-xs text-[#86868b] space-y-2">
          <span>{error}</span>
          <button onClick={() => loadBacktest()} className="px-3 py-1.5 bg-[#0071e3] text-white rounded-md">다시 시도</button>
        </div>
      ) : !data || data.history.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs text-[#86868b]">
          백테스트 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white/70">
          {(() => {
            const xgbThresh = data.thresholds?.XGB ?? 0.52;
            const rfThresh = data.thresholds?.RF ?? 0.52;
            const ensThresh = data.thresholds?.Ensemble ?? 0.51;

            return (
              <table className="w-full text-left text-xs text-[#1d1d1f]">
                <thead className="bg-black/[0.03] text-[#86868b] uppercase text-[10px] tracking-wider border-b border-black/[0.05] font-bold">
                  <tr>
                    <th className="py-3 px-3.5">기준 거래일</th>
                    <th className="py-3 px-3.5">예측 목표일</th>
                    <th className="py-3 px-3.5">
                      XGBoost <span className="text-[9px] font-normal text-[#86868b]">({(xgbThresh * 100).toFixed(0)}%)</span>
                    </th>
                    <th className="py-3 px-3.5">
                      Random Forest <span className="text-[9px] font-normal text-[#86868b]">({(rfThresh * 100).toFixed(0)}%)</span>
                    </th>
                    <th className="py-3 px-3.5 text-[#0071e3] font-bold">
                      Ensemble <span className="text-[9px] font-normal text-[#0071e3]/80">({(ensThresh * 100).toFixed(0)}%)</span>
                    </th>
                    <th className="py-3 px-3.5 text-right">실제 수익률</th>
                    <th className="py-3 px-3.5 text-center">실제 결과</th>
                    <th className="py-3 px-3.5 text-center">적중 여부</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] font-mono">
                  {data.history.map((row, idx) => {
                    const isUpActual = row.actual_return_pct > 0;
                    const isUpXgb = row.xgb_label === '상승';
                    const isUpRf = row.rf_label === '상승';
                    const isUpEns = row.ensemble_label === '상승';
                    return (
                      <tr key={idx} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-2.5 px-3.5 text-[#86868b]">{row.base_date}</td>
                        <td className="py-2.5 px-3.5 text-[#1d1d1f] font-semibold">{row.target_date}</td>
                        <td className="py-2.5 px-3.5 font-medium">
                          <span className={isUpXgb ? 'text-[#e02424] font-semibold' : 'text-[#059669] font-semibold'}>
                            {row.xgb_label} ({(row.xgb_prob * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-medium">
                          <span className={isUpRf ? 'text-[#e02424] font-semibold' : 'text-[#059669] font-semibold'}>
                            {row.rf_label} ({(row.rf_prob * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold">
                          <span className={isUpEns ? 'text-[#e02424]' : 'text-[#059669]'}>
                            {row.ensemble_label} ({(row.ensemble_prob * 100).toFixed(1)}%)
                          </span>
                        </td>
                    <td className={`py-2.5 px-3.5 text-right font-bold ${
                      isUpActual ? 'text-[#e02424]' : 'text-[#059669]'
                    }`}>
                      {isUpActual ? '+' : ''}{row.actual_return_pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-sans">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        isUpActual 
                          ? 'bg-[#e02424]/[0.08] text-[#e02424] border-[#e02424]/20' 
                          : 'bg-[#059669]/[0.08] text-[#059669] border-[#059669]/20'
                      }`}>
                        {isUpActual ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {row.actual_direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-sans">
                      {row.is_hit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#059669]/[0.08] text-[#059669] border border-[#059669]/20 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 적중
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e02424]/[0.08] text-[#e02424] border border-[#e02424]/20 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> 불일치
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default BacktestTable;
