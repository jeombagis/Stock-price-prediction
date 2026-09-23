# 📈 StockAlgo AI × StockPred AI

> **인터랙티브 금융 대시보드 (StockAlgo AI)** × **머신러닝 앙상블 주가 예측 엔진 (StockPred AI)**  
> S&P 500 및 NASDAQ-100 지수의 익일 등락 예측 및 기술적 지표 분석을 제공하는 풀스택 금융 인공지능 플랫폼입니다.

---

## 🏛️ 브랜딩 및 아키텍처 개요

본 프로젝트는 사용자 경험 중심의 프론트엔드와 고성능 머신러닝 예측 백엔드가 결합된 구조입니다.

- **🎨 Frontend — StockAlgo AI (`stockalgoai`)**
  - Apple 스타일의 깔끔하고 직관적인 인터랙티브 금융 대시보드
  - 실시간 주가 차트(캔들스틱/이동평균/볼린저밴드), RSI/MACD 보조지표 시각화
  - 5대 AI 모델별 상승 확률 게이지, 피처 중요도(XAI) 차트, 백테스팅 검증 테이블 및 파라미터 튜닝 UI 제공
- **⚙️ Backend — StockPred AI (`stockpredai`)**
  - FastAPI 기반 고성능 비동기 REST API 서버 및 머신러닝 파이프라인 엔진
  - XGBoost, LightGBM, Random Forest, Logistic Regression 및 Soft Voting 앙상블 모델 운용
  - Yahoo Finance 연동 최신 시세 수집, 15+ 기술적 지표 생성, 사전 학습 가중치(`.pkl`) 기반 초고속 추론 및 재학습 지원

---

## 🌟 주요 기능 (Key Features)

1. **AI 익일 주가 예측 브리핑 (Prediction Overview)**
   - **StockPred AI** 5대 머신러닝 모델(**XGBoost**, **Random Forest**, **LightGBM**, **Logistic Regression**, **Soft Voting Master Ensemble**) 기반 익일 주가 등락 예측
   - 모델별 상승 확률(%), 신뢰도 스코어 및 AI 종합 투자 의견 제공
2. **핵심 글로벌 지수 지원 & 실시간 데이터 동기화**
   - 미국 대표 지수 **S&P 500 (`^GSPC`)** 및 **NASDAQ-100 (`^NDX`)** 전용 파이프라인
   - Yahoo Finance API 연동을 통한 1-Click 최신 시장 데이터 갱신 및 캐싱
3. **인터랙티브 차트 & 기술적 보조지표**
   - **StockAlgo AI** 대시보드를 통한 일봉 캔들/종가 차트, 이동평균선(MA20), EMA(5, 20), 볼린저 밴드
   - RSI(과매수/과매도 구간) 및 MACD / Signal / Histogram 서브 차트
4. **AI 피처 중요도 분석 (Explainable AI)**
   - 상위 핵심 기술적 지표(RSI, MACD, 단기/장기 변동성, Lag 수익률 등)의 모델 기여도 수평 바 차트
5. **과거 예측 vs 실제 결과 백테스팅 (Historical Backtest)**
   - 최근 20~60거래일 예측 방향 vs 실제 등락률 비교 테이블 및 적중률(Hit Ratio) 실시간 산출
6. **실시간 파라미터 튜닝 & 모델 재학습 (Interactive Retraining)**
   - 상승 판단 임계값(Threshold), 룩백 윈도우(Window Size), 학습 데이터 분할(Train Split)을 슬라이더로 조절하고 즉시 재예측/재학습

---

## 🏗️ 기술 스택 (Tech Stack)

### Frontend — StockAlgo AI
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, PostCSS (Apple Glassmorphism UI)
- **Visualization**: Recharts, Lucide React
- **Network**: Axios

### Backend — StockPred AI
- **Runtime & Environment**: Python 3.11 (Conda: `stock_pred`)
- **Server Framework**: FastAPI, Uvicorn, Pydantic
- **Machine Learning**: Scikit-Learn, XGBoost, LightGBM, Joblib
- **Data Engineering**: Pandas, NumPy, yfinance

---

## 🚀 빠른 시작 (Quick Start)

### 1. 원클릭 통합 실행 (추천)
터미널에서 아래 통합 실행 스크립트를 구동하면 백엔드(**StockPred AI**)와 프론트엔드(**StockAlgo AI**)가 함께 실행됩니다:

```bash
./start.sh
```

- **StockAlgo AI 웹 대시보드**: [http://localhost:3101](http://localhost:3101)
- **StockPred AI Swagger API 문서**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. 수동 개별 실행 방법

#### 가상환경 활성화
```bash
conda activate stock_pred
```

#### 백엔드 실행 (StockPred AI, Terminal 1)
```bash
python backend/run.py
```
> 서버가 실행되면 [http://localhost:8000](http://localhost:8000) 및 [http://localhost:8000/docs](http://localhost:8000/docs)에서 API 확인이 가능합니다.

#### 프론트엔드 실행 (StockAlgo AI, Terminal 2)
```bash
cd frontend
npm run dev
```
> 개발 서버가 실행되면 [http://localhost:3101](http://localhost:3101)에서 대시보드에 접속할 수 있습니다.

---

## 📁 프로젝트 구조

```
Stock-price-prediction/
├── backend/                       # [StockPred AI] 백엔드 & ML 예측 엔진
│   ├── app/
│   │   ├── api/routes.py          # REST API 엔드포인트 (/api/*)
│   │   ├── models/schemas.py      # Pydantic 요청/응답 스키마
│   │   ├── services/
│   │   │   ├── data_service.py    # yfinance 데이터 수집, CSV 로드 및 캐시
│   │   │   ├── feature_engine.py  # 15+ 기술적 지표 생성 및 데이터 가공
│   │   │   ├── model_engine.py    # 머신러닝 앙상블 학습, 추론 및 가중치 관리
│   │   │   └── backtest_service.py # 과거 예측 vs 실제 백테스팅 검증
│   │   ├── config.py              # 전역 설정 및 자산 프리셋 관리
│   │   └── main.py                # FastAPI 애플리케이션 진입점
│   ├── requirements.txt           # 백엔드 의존성 패키지
│   └── run.py                     # 백엔드 서버 구동 스크립트
├── frontend/                      # [StockAlgo AI] 프론트엔드 웹 대시보드
│   ├── src/
│   │   ├── components/            # UI 컴포넌트
│   │   │   ├── Header.tsx         # 상단 헤더 & 지수 선택 바
│   │   │   ├── PredictionHero.tsx # AI 예측 헤드라인 & 확률 게이지
│   │   │   ├── ModelProbabilities.tsx # 5개 모델별 확률 카드
│   │   │   ├── StockChart.tsx     # 주가 및 보조지표 인터랙티브 차트
│   │   │   ├── FeatureImportance.tsx  # 피처 기여도 수평 바 차트
│   │   │   ├── BacktestTable.tsx  # 백테스트 적중률 테이블
│   │   │   ├── ParameterModal.tsx # 파라미터 조절 & 재학습 모달
│   │   │   └── LegalModal.tsx     # 법적 고지 및 면책 조항 모달
│   │   ├── services/api.ts        # 백엔드 연동 API 클라이언트
│   │   ├── types/index.ts         # 프론트엔드 TypeScript 타입 정의
│   │   ├── App.tsx                # 대시보드 메인 레이아웃
│   │   └── main.tsx               # React 진입점
│   ├── package.json
│   └── vite.config.ts
├── model/                         # ML 모델 학습, 데이터 추출 및 일일 예측 스크립트
│   ├── train_models.py            # 사전 학습 모델 생성 및 저장 스크립트
│   ├── run_daily_prediction.ipynb # 일별 최신 데이터 다운로드 및 익일 주가 예측
│   ├── Data_extraction.ipynb      # 시드 데이터 다운로드 및 CSV 추출
│   └── Stock_Classification.ipynb # 탐색적 데이터 분석 및 모델 실험
├── saved_models/                  # 사전 학습된 모델 가중치 및 스케일러 (.pkl)
├── csv/                           # 일봉 원본 데이터셋 저장 디렉토리 (*.csv)
├── start.sh                       # 원클릭 통합 실행 스크립트
├── requirements.txt               # 프로젝트 루트 패키지 의존성
└── README.md
```

---

## ⚠️ 면책 조항 (Disclaimer)

- **비상업적 연구 목적**: 본 프로젝트(**StockAlgo AI** 대시보드 및 **StockPred AI** 예측 엔진)는 학술 연구, 통계 분석 및 알고리즘 성능 검증을 위한 오픈소스 프로젝트입니다.
- **투자 권유 배제**: 대한민국 「자본시장과 금융투자업에 관한 법률」에 따른 금융투자업 또는 투자자문업에 해당하지 않으며, 특정 주식 또는 금융상품의 매수/매도를 권유하지 않습니다.
- **투자 책임**: 모델이 제공하는 예측 결과 및 확률은 과거 데이터에 기반한 통계적 추정치이며 미래의 투자 성과를 보장하지 않습니다. 모든 금융 투자에는 원금 손실 위험이 따르며, 최종 투자 결정과 그에 따른 손익의 책임은 투자자 본인에게 있습니다.
