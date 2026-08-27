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
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">과거 예측 vs 실제 시장 결과 백테스트</h2>
          <span className="text-xs text-gray-400">({data?.asset_name})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Days Filter */}
          <div className="flex bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-xs">
            {[10, 20, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-md transition ${
                  days === d ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-gray-400 hover:text-white'
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
          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">방향 적중률 (Hit Ratio)</div>
              <div className="text-lg font-bold text-white">
                {data.hit_ratio_pct}% <span className="text-xs font-normal text-gray-400">({data.hit_count}/{data.total_days})</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Out-of-Sample 정확도</div>
              <div className="text-lg font-bold text-emerald-400">
                {(data.out_of_sample_acc * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Macro F1 Score</div>
              <div className="text-lg font-bold text-cyan-400">
                {data.out_of_sample_f1.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400">마스터 시그널 기준</div>
              <div className="text-xs font-semibold text-gray-200 mt-1">
                앙상블 Soft Voting
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>백테스트 히스토리 로드 중...</span>
          </div>
        </div>
      ) : !data || data.history.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          백테스트 데이터가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">기준 거래일</th>
                <th className="py-2.5 px-3">예측 목표일</th>
                <th className="py-2.5 px-3">XGBoost (확률)</th>
                <th className="py-2.5 px-3">Random Forest</th>
                <th className="py-2.5 px-3 text-indigo-400">Ensemble (마스터)</th>
                <th className="py-2.5 px-3 text-right">실제 수익률</th>
                <th className="py-2.5 px-3 text-center">실제 결과</th>
                <th className="py-2.5 px-3 text-center">적중 여부</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {data.history.map((row, idx) => {
                const isUpActual = row.actual_return_pct > 0;
                return (
                  <tr key={idx} className="hover:bg-gray-800/40 transition">
                    <td className="py-2.5 px-3 text-gray-400">{row.base_date}</td>
                    <td className="py-2.5 px-3 text-gray-200 font-semibold">{row.target_date}</td>
                    <td className="py-2.5 px-3">
                      <span className={row.xgb_prob >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.xgb_label} ({(row.xgb_prob * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={row.rf_prob >= 0.5 ? 'text-emerald-400' : 'text-rose-400'}>
                        {row.rf_label} ({(row.rf_prob * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-300">
                      {row.ensemble_label} ({(row.ensemble_prob * 100).toFixed(1)}%)
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      isUpActual ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isUpActual ? '+' : ''}{row.actual_return_pct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans ${
                        isUpActual ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {isUpActual ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {row.actual_direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {row.is_hit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 적중
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" /> 불일치
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
