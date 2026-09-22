import sys
import os
import pytest
import pandas as pd
import numpy as np

# backend 디렉토리를 모듈 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def sample_stock_df():
    """테스트용 샘플 주가 DataFrame 생성 (200일치)"""
    np.random.seed(42)
    n = 200
    dates = pd.date_range('2024-01-01', periods=n, freq='B')  # 영업일 기준
    
    close_prices = 5000 + np.cumsum(np.random.randn(n) * 20)
    
    df = pd.DataFrame({
        'date': dates.strftime('%Y%m%d'),
        'open': close_prices + np.random.randn(n) * 5,
        'high': close_prices + abs(np.random.randn(n) * 15),
        'low': close_prices - abs(np.random.randn(n) * 15),
        'close': close_prices,
        'volume': np.random.randint(1_000_000, 5_000_000, size=n).astype(float),
    })
    
    # Ensure high >= close >= low and high >= open >= low
    df['high'] = df[['open', 'high', 'low', 'close']].max(axis=1)
    df['low'] = df[['open', 'high', 'low', 'close']].min(axis=1)
    
    return df


@pytest.fixture
def sample_asset_key():
    return "SnP500"
