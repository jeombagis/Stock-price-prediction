#!/usr/bin/env python3
"""
S&P 500 및 NASDAQ-100 머신러닝 모델 정규 학습 및 피클(.pkl) 저장 스크립트
model/Stock_Classification.ipynb 기반 TimeSeriesSplit 및 Time-Decay 가중치 학습 파이프라인
"""

import os
import glob
from pathlib import Path
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import warnings

warnings.filterwarnings('ignore')

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SAVED_MODELS_DIR = PROJECT_ROOT / "saved_models"
SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)

class TrainingConfig:
    WINDOW_SIZE = 5      # Lag 윈도우 크기 (5거래일)
    THRESHOLD = 0.002    # 상승 판단 임계값 (+0.2%)
    TRAIN_SPLIT = 0.8    # 80% 학습, 20% Out-of-sample 테스트

    DATA_SOURCES = {
        "SnP500": {
            "name": "S&P 500",
            "file_pattern": "SnP500_*.csv"
        },
        "Nasdaq100": {
            "name": "Nasdaq 100",
            "file_pattern": "Nasdaq100_*.csv"
        }
    }


def load_and_preprocess(file_path: Path) -> pd.DataFrame:
    """CSV 로드 및 기술적 보조지표/피처 생성"""
    df = pd.read_csv(file_path)
    df.columns = [c.lower().strip() for c in df.columns]
    
    # date 형식 통일 및 오름차순 정렬
    df['date'] = df['date'].astype(str).str.replace('-', '')
    df = df.sort_values(by='date').reset_index(drop=True)
    
    cols = ['open', 'high', 'low', 'close', 'volume']
    for col in cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=cols).reset_index(drop=True)

    # 1. 기본 변동성 지표
    df['return'] = df['close'].pct_change()
    df['vol_change'] = df['volume'].pct_change()
    df['high_low_gap'] = (df['high'] - df['low']) / df['open']

    # 2. RSI (14)
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0.0).rolling(window=14).mean()
    loss = -delta.where(delta < 0, 0.0).rolling(window=14).mean()
    rs = gain / loss.replace(0, np.nan)
    df['RSI'] = 100.0 - (100.0 / (1.0 + rs))

    # 3. MACD & Signal & Histogram
    exp1 = df['close'].ewm(span=12, adjust=False).mean()
    exp2 = df['close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = (exp1 - exp2) / df['close']
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']

    # 4. Bollinger Bands (20, 2)
    df['MA20'] = df['close'].rolling(window=20).mean()
    df['std20'] = df['close'].rolling(window=20).std()
    df['BB_Upper'] = df['MA20'] + (df['std20'] * 2)
    df['BB_Lower'] = df['MA20'] - (df['std20'] * 2)
    df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['MA20']

    # 5. Stochastic Oscillator (14, 3)
    low_min = df['low'].rolling(window=14).min()
    high_max = df['high'].rolling(window=14).max()
    denom = (high_max - low_min).replace(0, np.nan)
    df['Stochastic_K'] = 100.0 * (df['close'] - low_min) / denom
    df['Stochastic_D'] = df['Stochastic_K'].rolling(window=3).mean()

    # 6. ATR (14)
    tr1 = df['high'] - df['low']
    tr2 = (df['high'] - df['close'].shift()).abs()
    tr3 = (df['low'] - df['close'].shift()).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(window=14).mean() / df['close']

    # 7. EMA 비율
    for span in [5, 10, 20, 50]:
        df[f'EMA_{span}'] = df['close'].ewm(span=span, adjust=False).mean() / df['close']

    # 8. Williams %R & ROC
    df['Williams_R'] = (high_max - df['close']) / denom * -100.0
    df['ROC_10'] = df['close'].pct_change(periods=10)
    df['ROC_20'] = df['close'].pct_change(periods=20)

    # 9. 시차(Lag) 피처
    lag_features = {}
    for i in range(1, TrainingConfig.WINDOW_SIZE + 1):
        lag_features[f'return_lag_{i}'] = df['return'].shift(i)
        lag_features[f'vol_lag_{i}'] = df['vol_change'].shift(i)
    df = pd.concat([df, pd.DataFrame(lag_features, index=df.index)], axis=1)

    # 10. Target (익일 수익률 > THRESHOLD 시 1, 아니면 0)
    df['target'] = (df['return'].shift(-1) > TrainingConfig.THRESHOLD).astype(int)
    df['Next_Return'] = df['return'].shift(-1)

    df = df.replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
    return df


def get_feature_list():
    features = [
        'return', 'vol_change', 'high_low_gap', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist',
        'BB_Width', 'Stochastic_K', 'Stochastic_D', 'ATR', 'Williams_R', 'ROC_10', 'ROC_20'
    ] + [f'EMA_{s}' for s in [5, 10, 20, 50]] + \
        [f'return_lag_{i}' for i in range(1, TrainingConfig.WINDOW_SIZE + 1)] + \
        [f'vol_lag_{i}' for i in range(1, TrainingConfig.WINDOW_SIZE + 1)]
    return features


def train_asset_models(asset_key: str, info: dict):
    print(f"\n=======================================================")
    print(f"🚀 [{info['name']}] 정규 머신러닝 모델 학습 시작...")
    print(f"=======================================================")

    pattern = str(PROJECT_ROOT / info['file_pattern'])
    matches = glob.glob(pattern)
    if not matches:
        raise FileNotFoundError(f"{info['file_pattern']} 원천 데이터 CSV 파일을 찾을 수 없습니다.")
    csv_file = sorted(matches)[-1]
    print(f"📁 원천 데이터 파일: {csv_file}")

    df = load_and_preprocess(Path(csv_file))
    features = get_feature_list()
    print(f"📊 총 레코드 수: {len(df):,}개 | 생성된 피처 수: {len(features)}개")

    X = df[features]
    y = df['target']
    split_idx = int(len(df) * TrainingConfig.TRAIN_SPLIT)

    X_train_raw = X.iloc[:split_idx]
    X_test_raw = X.iloc[split_idx:]
    y_train = y.iloc[:split_idx]
    y_test = y.iloc[split_idx:]
    df_test = df.iloc[split_idx:].copy().reset_index(drop=True)

    # 1. StandardScaler 학습 및 분리 (Data Leakage 차단)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_raw)
    X_test_scaled = scaler.transform(X_test_raw)

    X_train = pd.DataFrame(X_train_scaled, columns=features, index=X_train_raw.index)
    X_test = pd.DataFrame(X_test_scaled, columns=features, index=X_test_raw.index)

    # 2. 클래스 불균형 및 Time-Decay 가중치 계산
    neg_count = sum(y_train == 0)
    pos_count = sum(y_train == 1)
    scale_pos = (neg_count / pos_count) if pos_count > 0 else 1.0
    sample_weights = np.linspace(0.1, 1.0, len(y_train))

    # 3. 모델 정의 (노트북에서 검증된 최적 하이퍼파라미터 적용)
    best_xgb = XGBClassifier(
        n_estimators=300,
        learning_rate=0.03,
        max_depth=5,
        min_child_weight=3,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        scale_pos_weight=scale_pos,
        eval_metric='logloss',
        n_jobs=-1
    )

    best_rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=9,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features='sqrt',
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    best_lgbm = LGBMClassifier(
        n_estimators=300,
        learning_rate=0.03,
        max_depth=5,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        class_weight='balanced',
        verbose=-1,
        random_state=42,
        n_jobs=-1
    )

    best_lr = LogisticRegression(
        C=0.1,
        class_weight='balanced',
        max_iter=1000,
        solver='liblinear',
        random_state=42
    )

    # 4. Soft Voting 앙상블 생성
    ensemble = VotingClassifier(
        estimators=[
            ('XGB', best_xgb),
            ('RF', best_rf),
            ('LGBM', best_lgbm),
            ('LR', best_lr)
        ],
        voting='soft'
    )

    models_dict = {
        'XGB': best_xgb,
        'RF': best_rf,
        'LGBM': best_lgbm,
        'LR': best_lr,
        'Ensemble': ensemble
    }

    best_thresholds = {}
    eval_metrics = {}

    # 5. 각 모델 학습 및 임계값/지표 계산
    for name, model in models_dict.items():
        print(f"\n[{name} 모델 학습 및 평가]")
        try:
            model.fit(X_train, y_train, sample_weight=sample_weights)
        except Exception:
            try:
                model.fit(
                    X_train, y_train,
                    XGB__sample_weight=sample_weights,
                    RF__sample_weight=sample_weights,
                    LGBM__sample_weight=sample_weights,
                    LR__sample_weight=sample_weights
                )
            except Exception:
                model.fit(X_train, y_train)

        # Train Set 기반 최적 Threshold 탐색 (Test 누수 방지)
        probs_train = model.predict_proba(X_train)[:, 1]
        best_th = 0.50
        best_f1_score = 0.0
        for th in np.arange(0.40, 0.60, 0.01):
            preds_th = (probs_train > th).astype(int)
            sc = f1_score(y_train, preds_th, average='macro', zero_division=0)
            if sc > best_f1_score:
                best_f1_score = sc
                best_th = float(th)

        best_thresholds[name] = best_th

        # Out-of-Sample Test Set 평가
        probs_test = model.predict_proba(X_test)[:, 1]
        test_preds = (probs_test > best_th).astype(int)
        acc = float(accuracy_score(y_test, test_preds))
        macro_f1 = float(f1_score(y_test, test_preds, average='macro', zero_division=0))

        eval_metrics[name] = {
            'accuracy': round(acc, 4),
            'f1_score': round(macro_f1, 4),
            'best_threshold': round(best_th, 4)
        }

        print(f" - Train 기준 최적 Threshold: {best_th:.2f}")
        print(f" - Out-of-Sample Accuracy: {acc:.4f}")
        print(f" - Out-of-Sample Macro F1: {macro_f1:.4f}")

    # 6. 피클(.pkl) 파일 저장
    scaler_file = SAVED_MODELS_DIR / f"scaler_{asset_key}.pkl"
    ensemble_file = SAVED_MODELS_DIR / f"ensemble_{asset_key}.pkl"
    models_bundle_file = SAVED_MODELS_DIR / f"models_{asset_key}.pkl"

    joblib.dump(scaler, scaler_file)
    print(f"💾 스케일러 저장 완료: {scaler_file}")

    joblib.dump(ensemble, ensemble_file)
    print(f"💾 앙상블 모델 저장 완료: {ensemble_file}")

    # 웹 대시보드 서빙용 통합 모델 번들
    bundle = {
        'asset_key': asset_key,
        'asset_name': info['name'],
        'models': models_dict,
        'best_thresholds': best_thresholds,
        'eval_metrics': eval_metrics,
        'features': features,
        'train_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_records': len(df),
        'X_test': X_test,
        'y_test': y_test,
        'df_test': df_test,
        'parameters': {
            'window_size': TrainingConfig.WINDOW_SIZE,
            'threshold': TrainingConfig.THRESHOLD,
            'train_split': TrainingConfig.TRAIN_SPLIT
        }
    }
    joblib.dump(bundle, models_bundle_file)
    print(f"💾 통합 모델 번들 저장 완료: {models_bundle_file}")
    print(f"✨ [{info['name']}] 파이프라인 완료!")


def main():
    print("="*60)
    print("📈 S&P 500 & NASDAQ-100 머신러닝 정규 모델 학습 파이프라인")
    print("="*60)

    for asset_key, info in TrainingConfig.DATA_SOURCES.items():
        train_asset_models(asset_key, info)

    print("\n🎉 모든 모델 학습 및 .pkl 파일 생성이 성공적으로 완료되었습니다!")

if __name__ == "__main__":
    main()
