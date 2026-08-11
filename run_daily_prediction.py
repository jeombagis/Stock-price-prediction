import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import warnings

warnings.filterwarnings('ignore')

class Config:
    WINDOW_SIZE = 5
    THRESHOLD = 0.0

def get_latest_data(ticker, name):
    print(f"📥 {name} ({ticker}) 최신 데이터 불러오는 중...")
    # 충분한 피처 생성을 위해 과거 5년치 데이터 다운로드
    df = yf.download(ticker, period="5y", progress=False)
    
    if df.empty:
        raise ValueError(f"{name} 데이터를 불러오지 못했습니다.")
        
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    df = df.reset_index()
    df.rename(columns={
        'Date': 'date', 'Open': 'open', 'High': 'high', 
        'Low': 'low', 'Close': 'close', 'Volume': 'volume'
    }, inplace=True)
    
    df = df[['date', 'open', 'high', 'low', 'close', 'volume']].dropna()
    df = df.sort_values(by='date', ascending=True).reset_index(drop=True)
    return df

def add_features(df):
    # 기본 변동성 지표
    df['return'] = df['close'].pct_change()
    df['vol_change'] = df['volume'].pct_change()
    df['high_low_gap'] = (df['high'] - df['low']) / df['open']

    # RSI
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))

    # MACD & Histogram
    exp1 = df['close'].ewm(span=12, adjust=False).mean()
    exp2 = df['close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = (exp1 - exp2) / df['close'] 
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']

    # Bollinger Bands
    df['MA20'] = df['close'].rolling(window=20).mean()
    df['std20'] = df['close'].rolling(window=20).std()
    df['BB_Upper'] = df['MA20'] + (df['std20'] * 2)
    df['BB_Lower'] = df['MA20'] - (df['std20'] * 2)
    df['BB_Width'] = (df['BB_Upper'] - df['BB_Lower']) / df['MA20']
    
    # Stochastic
    low_min = df['low'].rolling(window=14).min()
    high_max = df['high'].rolling(window=14).max()
    df['Stochastic_K'] = 100 * (df['close'] - low_min) / (high_max - low_min)
    df['Stochastic_D'] = df['Stochastic_K'].rolling(window=3).mean()

    # ATR
    tr = pd.concat([df['high'] - df['low'],
                    abs(df['high'] - df['close'].shift()),
                    abs(df['low'] - df['close'].shift())], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(window=14).mean() / df['close']

    # EMA
    for span in [5, 10, 20, 50]:
        df[f'EMA_{span}'] = df['close'].ewm(span=span, adjust=False).mean() / df['close']

    # Williams %R
    df['Williams_R'] = (high_max - df['close']) / (high_max - low_min) * -100
    
    # ROC
    df['ROC_10'] = df['close'].pct_change(periods=10)
    df['ROC_20'] = df['close'].pct_change(periods=20)

    # 시차(Lag) 피처
    lag_features = {}
    for i in range(1, Config.WINDOW_SIZE + 1):
        lag_features[f'return_lag_{i}'] = df['return'].shift(i)
        lag_features[f'vol_lag_{i}'] = df['vol_change'].shift(i)
    
    df = pd.concat([df, pd.DataFrame(lag_features)], axis=1)

    features = ['return', 'vol_change', 'high_low_gap', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist',
                'BB_Width', 'Stochastic_K', 'Stochastic_D', 'ATR', 'Williams_R', 'ROC_10', 'ROC_20'] + \
               [f'EMA_{s}' for s in [5, 10, 20, 50]] + \
               [f'return_lag_{i}' for i in range(1, Config.WINDOW_SIZE + 1)] + \
               [f'vol_lag_{i}' for i in range(1, Config.WINDOW_SIZE + 1)]

    # Target (내일의 수익률이 0보다 큰지)
    df['target'] = (df['return'].shift(-1) > Config.THRESHOLD).astype(int)
    
    # 마지막 행(오늘)은 내일 결과가 없으므로 target이 NaN입니다. 이는 예측용으로 분리합니다.
    today_df = df.iloc[-1:].copy()
    train_df = df.iloc[:-1].copy()
    
    train_df = train_df.replace([np.inf, -np.inf], np.nan).dropna().reset_index(drop=True)
    today_df = today_df.fillna(0) # 오늘 데이터의 결측치는 0으로 채움 (임시)
    
    return train_df, today_df, features

def train_and_predict(train_df, today_df, features, name):
    X_train = train_df[features]
    y_train = train_df['target']
    X_today = today_df[features]
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_today_scaled = scaler.transform(X_today)
    
    # 모델 학습
    print(f"⚙️  {name} 모델 학습 중 (XGBoost, Random Forest)...")
    xgb = XGBClassifier(random_state=42, eval_metric='logloss')
    rf = RandomForestClassifier(random_state=42, class_weight='balanced')
    
    xgb.fit(X_train_scaled, y_train)
    rf.fit(X_train_scaled, y_train)
    
    # 오늘 데이터 기반 내일 예측
    xgb_prob = xgb.predict_proba(X_today_scaled)[0][1] * 100
    rf_prob = rf.predict_proba(X_today_scaled)[0][1] * 100
    avg_prob = (xgb_prob + rf_prob) / 2
    
    last_close = today_df.iloc[-1]['close']
    last_date = today_df.iloc[-1]['date'].strftime('%Y-%m-%d')
    
    print("\n" + "="*50)
    print(f"📊 [{name}] 내일 장 예측 리포트")
    print("="*50)
    print(f"• 기준일 (오늘): {last_date}")
    print(f"• 현재 종가: {last_close:,.2f}")
    print(f"• XGBoost 상승 확률: {xgb_prob:.1f}%")
    print(f"• Random Forest 상승 확률: {rf_prob:.1f}%")
    print(f"👉 종합 상승 확률: {avg_prob:.1f}%")
    
    if avg_prob >= 60:
        print("\n🚀 결론: 상승 확률이 높습니다. (비중 확대 고려)")
    elif avg_prob <= 40:
        print("\n⚠️ 결론: 하락 확률이 높습니다. (보수적 접근 / 비중 축소)")
    else:
        print("\n🤔 결론: 방향성이 뚜렷하지 않습니다. (관망 권장)")
    print("="*50 + "\n")

if __name__ == "__main__":
    print("\n" + "#"*50)
    print("📈 인공지능 기반 주가 흐름 예측 시스템 시작")
    print("#"*50 + "\n")
    
    indices = {
        "S&P 500": "^GSPC",
        "Nasdaq 100": "^NDX"
    }
    
    for name, ticker in indices.items():
        try:
            # 1. 데이터 추출
            df = get_latest_data(ticker, name)
            
            # 2. 피처 엔지니어링 및 분리
            train_df, today_df, features = add_features(df)
            
            # 3. 모델 학습 및 내일 장 예측 출력
            train_and_predict(train_df, today_df, features, name)
            
        except Exception as e:
            print(f"❌ {name} 처리 중 에러 발생: {e}")
