from typing import List, Tuple, Dict
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from app.config import AppConfig

FEATURE_DESCRIPTIONS: Dict[str, str] = {
    "return": "전일 대비 일간 종가 등락률",
    "vol_change": "전일 대비 일간 거래량 변동률",
    "high_low_gap": "당일 장중 고가-저가 변동폭 비율 (고가-저가)/시가",
    "RSI": "상대강도지수 (14일) - 과매수(70)/과매도(30) 판별",
    "MACD": "단기(12)와 장기(26) 이동평균 차이 비율",
    "MACD_Signal": "MACD의 9일 지수이동평균",
    "MACD_Hist": "MACD와 Signal의 차이 (모멘텀 방향성)",
    "BB_Width": "볼린저 밴드 너비 ((상단-하단)/중심선)",
    "Stochastic_K": "스토캐스틱 %K (14일간 가격 위치)",
    "Stochastic_D": "스토캐스틱 %D (%K의 3일 이동평균)",
    "ATR": "평균 실제 가격 변동폭 비율 (14일 ATR / 종가)",
    "Williams_R": "윌리엄스 %R (-100 ~ 0, 과매수/과매도)",
    "ROC_10": "10일간 가격 변화율 (Rate of Change)",
    "ROC_20": "20일간 가격 변화율 (Rate of Change)",
    "EMA_5": "5일 지수이동평균 비율 (EMA_5 / 종가)",
    "EMA_10": "10일 지수이동평균 비율 (EMA_10 / 종가)",
    "EMA_20": "20일 지수이동평균 비율 (EMA_20 / 종가)",
    "EMA_50": "50일 지수이동평균 비율 (EMA_50 / 종가)",
}

class FeatureEngine:
    def __init__(self, window_size: int = AppConfig.WINDOW_SIZE, threshold: float = AppConfig.THRESHOLD):
        self.window_size = window_size
        self.threshold = threshold
        self.scaler = StandardScaler()
        self.features: List[str] = []

    def compute_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        차트 표시 및 피처 생성을 위한 기술적 지표 계산
        """
        df = df.copy()
        
        # 1. 기본 변동성 지표
        df['return'] = df['close'].pct_change()
        df['vol_change'] = df['volume'].pct_change().replace([np.inf, -np.inf], 0)
        df['high_low_gap'] = (df['high'] - df['low']) / df['open'].replace(0, np.nan)

        # 2. RSI (14일)
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
        rs = gain / loss.replace(0, np.nan)
        df['RSI'] = 100 - (100 / (1 + rs))

        # 3. MACD & Histogram
        exp1 = df['close'].ewm(span=12, adjust=False).mean()
        exp2 = df['close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = (exp1 - exp2) / df['close']
        df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']

        # 4. Bollinger Bands & Width
        df['MA20'] = df['close'].rolling(window=20).mean()
        df['std20'] = df['close'].rolling(window=20).std()
        df['BB_Upper'] = df['MA20'] + (df['std20'] * 2)
        df['BB_Lower'] = df['MA20'] - (df['std20'] * 2)
        df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['MA20'].replace(0, np.nan)

        # 5. Stochastic
        low_min = df['low'].rolling(window=14).min()
        high_max = df['high'].rolling(window=14).max()
        denom = (high_max - low_min).replace(0, np.nan)
        df['Stochastic_K'] = 100 * (df['close'] - low_min) / denom
        df['Stochastic_D'] = df['Stochastic_K'].rolling(window=3).mean()

        # 6. ATR
        tr = pd.concat([
            df['high'] - df['low'],
            abs(df['high'] - df['close'].shift()),
            abs(df['low'] - df['close'].shift())
        ], axis=1).max(axis=1)
        df['ATR'] = tr.rolling(window=14).mean() / df['close']

        # 7. EMA 비율
        for span in [5, 10, 20, 50]:
            ema_val = df['close'].ewm(span=span, adjust=False).mean()
            df[f'raw_EMA_{span}'] = ema_val
            df[f'EMA_{span}'] = ema_val / df['close']

        # 8. Williams %R & ROC
        df['Williams_R'] = (high_max - df['close']) / denom * -100
        df['ROC_10'] = df['close'].pct_change(periods=10)
        df['ROC_20'] = df['close'].pct_change(periods=20)

        # 9. 시차(Lag) 피처
        lag_features = {}
        for i in range(1, self.window_size + 1):
            lag_features[f'return_lag_{i}'] = df['return'].shift(i)
            lag_features[f'vol_lag_{i}'] = df['vol_change'].shift(i)
            FEATURE_DESCRIPTIONS[f'return_lag_{i}'] = f"{i}일 전 수익률"
            FEATURE_DESCRIPTIONS[f'vol_lag_{i}'] = f"{i}일 전 거래량 변동률"

        df = pd.concat([df, pd.DataFrame(lag_features, index=df.index)], axis=1)

        # 피처 목록 정의
        self.features = [
            'return', 'vol_change', 'high_low_gap', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist',
            'BB_Width', 'Stochastic_K', 'Stochastic_D', 'ATR', 'Williams_R', 'ROC_10', 'ROC_20'
        ] + [f'EMA_{s}' for s in [5, 10, 20, 50]] + \
            [f'return_lag_{i}' for i in range(1, self.window_size + 1)] + \
            [f'vol_lag_{i}' for i in range(1, self.window_size + 1)]

        # Target 생성 (익일 수익률 > Threshold 이면 1, 아니면 0)
        df['target'] = (df['return'].shift(-1) > self.threshold).astype(int)
        df['Next_Return'] = df['return'].shift(-1)

        # 결측치 및 무한대 제거
        df = df.replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
        return df

    def split_and_scale(self, df: pd.DataFrame, train_split: float = AppConfig.TRAIN_SPLIT):
        """
        Train/Test 데이터 분리 및 스케일링 수행 (Data Leakage 방지)
        """
        X = df[self.features]
        y = df['target']
        split_idx = int(len(df) * train_split)

        X_train_raw = X.iloc[:split_idx]
        X_test_raw = X.iloc[split_idx:]

        # Train 데이터로만 스케일러 fit
        X_train_scaled = self.scaler.fit_transform(X_train_raw)
        X_test_scaled = self.scaler.transform(X_test_raw)

        X_train = pd.DataFrame(X_train_scaled, columns=self.features, index=X_train_raw.index)
        X_test = pd.DataFrame(X_test_scaled, columns=self.features, index=X_test_raw.index)

        y_train = y.iloc[:split_idx]
        y_test = y.iloc[split_idx:]

        df_test = df.iloc[split_idx:].copy().reset_index(drop=True)
        # Next_Return 결측치 보정
        df_test['Next_Return'] = df_test['Next_Return'].fillna(0)

        return X_train, X_test, y_train, y_test, df_test
