import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, XCircle, Award, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { BacktestSummaryResponse } from '../types';
import { api } from '../services/api';

interface BacktestTableProps {
  assetKey: string;
}

export const BacktestTable: React.FC<BacktestTableProps> = ({ assetKey }) => {
  const [days, setDays] = useState<number>(20);
  const [data, setData] = useState<BacktestSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadBacktest = async () => {
      setLoading(true);
      try {
        const res = await api.getBacktest(assetKey, days);
        if (isMounted) setData(res);
      } catch (err) {
        console.error("Failed to load backtest data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBacktest();
    return () => { isMounted = false; };
  }, [assetKey, days]);

  return (
    <div className="liquid-glass rounded-3xl p-5 sm:p-6 space-y-4 shadow-glass border border-white/90">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">과거 예측 vs 실제 시장 결과 백테스트</h2>
          <span className="text-xs text-slate-400 font-medium">({data?.asset_name})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Days Filter */}
          <div className="flex bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60 text-xs shadow-inner">
            {[10, 20, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg transition font-semibold ${
                  days === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                최근 {d}일
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/60 p-3.5 rounded-2xl border border-white/80 shadow-xs flex items-center gap-3 backdrop-blur-md">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">방향 적중률 (Hit Ratio)</div>
              <div className="text-lg font-black text-slate-900">
                {data.hit_ratio_pct}% <span className="text-xs font-normal text-slate-400">({data.hit_count}/{data.total_days})</span>
              </div>
            </div>
          </div>

          <div className="bg-white/60 p-3.5 rounded-2xl border border-white/80 shadow-xs flex items-center gap-3 backdrop-blur-md">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">Out-of-Sample 정확도</div>
              <div className="text-lg font-black text-emerald-700">
                {(data.out_of_sample_acc * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="bg-white/60 p-3.5 rounded-2xl border border-white/80 shadow-xs flex items-center gap-3 backdrop-blur-md">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">Macro F1 Score</div>
              <div className="text-lg font-black text-cyan-700">
                {data.out_of_sample_f1.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="bg-white/60 p-3.5 rounded-2xl border border-white/80 shadow-xs flex items-center gap-3 backdrop-blur-md">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400">마스터 시그널 기준</div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                앙상블 Soft Voting
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium text-slate-600">백테스트 히스토리 로드 중...</span>
          </div>
        </div>
      ) : !data || data.history.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-slate-400">
          백테스트 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/50 backdrop-blur-md">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/70 font-bold">
              <tr>
                <th className="py-3 px-3.5">기준 거래일</th>
                <th className="py-3 px-3.5">예측 목표일</th>
                <th className="py-3 px-3.5">XGBoost (확률)</th>
                <th className="py-3 px-3.5">Random Forest</th>
                <th className="py-3 px-3.5 text-indigo-700 font-extrabold">Ensemble (마스터)</th>
                <th className="py-3 px-3.5 text-right">실제 수익률</th>
                <th className="py-3 px-3.5 text-center">실제 결과</th>
                <th className="py-3 px-3.5 text-center">적중 여부</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 font-mono">
              {data.history.map((row, idx) => {
                const isUpActual = row.actual_return_pct > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3.5 text-slate-400">{row.base_date}</td>
                    <td className="py-3 px-3.5 text-slate-900 font-bold">{row.target_date}</td>
                    <td className="py-3 px-3.5 font-medium">
                      <span className={row.xgb_prob >= 0.5 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {row.xgb_label} ({(row.xgb_prob * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-medium">
                      <span className={row.rf_prob >= 0.5 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {row.rf_label} ({(row.rf_prob * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-indigo-700">
                      {row.ensemble_label} ({(row.ensemble_prob * 100).toFixed(1)}%)
                    </td>
                    <td className={`py-3 px-3.5 text-right font-black ${
                      isUpActual ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {isUpActual ? '+' : ''}{row.actual_return_pct.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-sans font-bold border shadow-2xs ${
                        isUpActual ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-rose-50 text-rose-700 border-rose-200/80'
                      }`}>
                        {isUpActual ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {row.actual_direction}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center font-sans">
                      {row.is_hit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 적중
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold shadow-2xs">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> 불일치
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
