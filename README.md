# 📈 Stock Price Prediction AI (Full-Stack Web Dashboard)

> **TOMMY STUDIO** | 머신러닝 앙상블 기반 주가 예측 & 인터랙티브 금융 대시보드 시스템

---

## 🌟 주요 기능 (Key Features)

1. **AI 익일 주가 예측 브리핑 (Prediction Overview)**
   - 5대 머신러닝 모델(**XGBoost**, **Random Forest**, **LightGBM**, **Logistic Regression**, **Soft Voting Master Ensemble**)을 활용한 익일 주가 상승/하락 예측
   - 모델별 상승 확률(%) 및 AI 종합 투자 의견 & 신뢰도 스코어 산출
2. **실시간 글로벌 자산 검색 & 동기화**
   - S&P 500 (`^GSPC`), Nasdaq 100 (`^NDX`), KOSPI (`^KS11`), KOSDAQ (`^KQ11`) 등 기본 프리셋
   - 애플(`AAPL`), 테슬라(`TSLA`), 엔비디아(`NVDA`), 삼성전자(`005930.KS`) 등 Yahoo Finance 전 세계 티커 지원
   - 1-Click 최신 데이터 동기화
3. **인터랙티브 차트 & 기술적 보조지표**
   - 일봉 캔들/종가 차트, 20일 이동평균선(MA20), EMA(5, 20), 볼린저 밴드
   - RSI (과매수/과매도 밴드) & MACD / Histogram 서브 차트
4. **AI 핵심 피처 중요도 분석 (Explainable AI)**
   - 상위 15개 핵심 기술적 지표(RSI, MACD, 변동성, Lag 수익률 등) 기여도 수평 바 차트
5. **과거 예측 vs 실제 결과 백테스팅 (Historical Backtest)**
   - 최근 20~60거래일 예측 vs 실제 주가 등락 비교 테이블 및 방향 적중률(Hit Ratio) 집계
6. **실시간 파라미터 튜닝 플레이그라운드**
   - 상승 임계치(Threshold), 윈도우 크기(Window Size), 학습 비율(Train Split)을 슬라이더로 조절하고 즉시 재학습

---

## 🏗️ 기술 스택 (Tech Stack)

- **Backend**: Python 3.11, FastAPI, Uvicorn, Pydantic, Pandas, NumPy, Scikit-Learn, XGBoost, LightGBM, yfinance
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React, Axios

---

## 🚀 빠른 시작 (Quick Start)

### 1. 원클릭 실행 (추천)
터미널에서 아래 명령어를 실행하면 백엔드와 프론트엔드가 동시에 실행됩니다:

```bash
./start.sh
```

- **웹 대시보드 접속**: [http://localhost:3101](http://localhost:3101)
- **FastAPI Swagger API 문서**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. 수동 실행 방법

#### 가상환경 활성화
```bash
conda activate stock_pred
```

#### 백엔드 실행 (Terminal 1)
```bash
python backend/run.py
```

#### 프론트엔드 실행 (Terminal 2)
```bash
cd frontend
npm run dev
```

---

## 📁 프로젝트 구조

```
Stock_Price_Prediction/
├── backend/
│   ├── app/
│   │   ├── api/routes.py              # REST API 엔드포인트 (/api/*)
│   │   ├── models/schemas.py          # Pydantic DTO
│   │   ├── services/
│   │   │   ├── data_service.py        # yfinance 데이터 수집 및 캐시
│   │   │   ├── feature_engine.py      # 15+ 기술적 지표 및 스케일러
│   │   │   ├── model_engine.py        # XGB/RF/LGBM/LR/Ensemble 학습 및 예측
│   │   │   └── backtest_service.py    # 과거 예측 vs 실제 백테스트
│   │   ├── config.py                  # 전역 설정
│   │   └── main.py                    # FastAPI 애플리케이션 진입점
│   ├── requirements.txt               # 백엔드 패키지
│   └── run.py                         # 백엔드 구동 스크립트
├── frontend/
│   ├── src/
│   │   ├── components/                # 대시보드 UI 컴포넌트
│   │   │   ├── Header.tsx             # 헤더 & 티커 검색 바
│   │   │   ├── PredictionHero.tsx     # 익일 예측 헤드라인 & 확률 게이지
│   │   │   ├── ModelProbabilities.tsx # 5개 모델별 확률 카드
│   │   │   ├── StockChart.tsx         # 주가 & 보조지표 차트
│   │   │   ├── FeatureImportance.tsx  # 피처 중요도 수평 바 차트
│   │   │   ├── BacktestTable.tsx      # 최근 20일 백테스트 검증 테이블
│   │   │   └── ParameterModal.tsx     # 파라미터 조절 & 실시간 재학습
│   │   ├── services/api.ts            # API 통신 클라이언트
│   │   ├── types/index.ts             # TypeScript 타입
│   │   ├── App.tsx                    # 대시보드 메인 레이아웃
│   │   └── main.tsx                   # React 진입점
│   └── package.json
├── start.sh                           # 원클릭 통합 실행 스크립트
├── SnP500_260707.csv                  # S&P 500 일봉 데이터셋
├── Nasdaq100_260707.csv               # Nasdaq 100 일봉 데이터셋
└── README.md
```

---

## ⚠️ 면책 조항 (Disclaimer)
본 시스템에서 제공하는 예측 결과는 머신러닝 알고리즘에 기초한 확률적 정보일 뿐이며, 금융 투자에 관한 조언이나 권유가 아닙니다. 모든 투자의 책임은 투자자 본인에게 있습니다.
