import pytest
import numpy as np
import pandas as pd
from app.services.feature_engine import FeatureEngine


class TestFeatureEngine:
    """FeatureEngine 기술적 지표 생성 및 데이터 무결성 테스트"""

    def test_compute_generates_28_features(self, sample_stock_df):
        """기본 window_size=5에서 28개 피처가 생성되는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        assert len(engine.features) == 28, f"Expected 28 features, got {len(engine.features)}"
        for feat in engine.features:
            assert feat in result.columns, f"Feature '{feat}' not found in result columns"

    def test_feature_names_order(self, sample_stock_df):
        """피처 이름과 순서가 train_models.py와 일치하는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        engine.compute_technical_indicators(sample_stock_df)
        
        expected_features = [
            'return', 'vol_change', 'high_low_gap', 'RSI', 'MACD', 'MACD_Signal', 'MACD_Hist',
            'BB_Width', 'Stochastic_K', 'Stochastic_D', 'ATR', 'Williams_R', 'ROC_10', 'ROC_20',
            'EMA_5', 'EMA_10', 'EMA_20', 'EMA_50',
            'return_lag_1', 'return_lag_2', 'return_lag_3', 'return_lag_4', 'return_lag_5',
            'vol_lag_1', 'vol_lag_2', 'vol_lag_3', 'vol_lag_4', 'vol_lag_5'
        ]
        assert engine.features == expected_features

    def test_no_nan_in_output(self, sample_stock_df):
        """결과 DataFrame에 NaN이 없는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        assert not result[engine.features].isna().any().any(), "NaN found in feature columns"

    def test_no_inf_in_output(self, sample_stock_df):
        """결과 DataFrame에 inf가 없는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        assert not np.isinf(result[engine.features].values).any(), "Inf found in feature columns"

    def test_target_column_binary(self, sample_stock_df):
        """타겟 컬럼이 0 또는 1로만 구성되는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        unique_targets = set(result['target'].unique())
        assert unique_targets.issubset({0, 1}), f"Target contains unexpected values: {unique_targets}"

    def test_split_and_scale_no_leakage(self, sample_stock_df):
        """Train/Test 분할 시 Data Leakage가 발생하지 않는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        X_train, X_test, y_train, y_test, df_test = engine.split_and_scale(result, train_split=0.8)
        
        # Train과 Test 인덱스가 겹치지 않아야 함
        train_indices = set(X_train.index.tolist())
        test_indices = set(X_test.index.tolist())
        assert train_indices.isdisjoint(test_indices), "Train and Test indices overlap!"
        
        # Train이 시간적으로 Test보다 앞서야 함
        assert X_train.index.max() < X_test.index.min(), "Train data is not before Test data!"

    def test_different_window_size(self, sample_stock_df):
        """window_size 변경 시 피처 수가 올바르게 변하는지 확인"""
        engine3 = FeatureEngine(window_size=3, threshold=0.002)
        result3 = engine3.compute_technical_indicators(sample_stock_df)
        
        engine10 = FeatureEngine(window_size=10, threshold=0.002)
        result10 = engine10.compute_technical_indicators(sample_stock_df)
        
        # window_size=3: 14 base + 4 EMA + 3*2 lag = 24
        assert len(engine3.features) == 24
        # window_size=10: 14 base + 4 EMA + 10*2 lag = 38
        assert len(engine10.features) == 38

    def test_rsi_range(self, sample_stock_df):
        """RSI 값이 0~100 범위인지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        assert result['RSI'].min() >= 0, f"RSI min is {result['RSI'].min()}"
        assert result['RSI'].max() <= 100, f"RSI max is {result['RSI'].max()}"

    def test_does_not_mutate_global_state(self, sample_stock_df):
        """전역 FEATURE_DESCRIPTIONS를 변경하지 않는지 확인"""
        from app.services.feature_engine import BASE_FEATURE_DESCRIPTIONS
        
        original_keys = set(BASE_FEATURE_DESCRIPTIONS.keys())
        
        engine = FeatureEngine(window_size=5, threshold=0.002)
        engine.compute_technical_indicators(sample_stock_df)
        
        assert set(BASE_FEATURE_DESCRIPTIONS.keys()) == original_keys, "Global FEATURE_DESCRIPTIONS was mutated!"

    def test_latest_row_preserved(self, sample_stock_df):
        """가장 최신 거래일(마지막 행)이 dropna로 인해 유실되지 않고 보존되는지 확인"""
        engine = FeatureEngine(window_size=5, threshold=0.002)
        result = engine.compute_technical_indicators(sample_stock_df)
        
        last_raw_date = sample_stock_df['date'].iloc[-1]
        last_processed_date = result['date'].iloc[-1]
        assert last_processed_date == last_raw_date, (
            f"최신 거래일이 유실되었습니다! Expected {last_raw_date}, got {last_processed_date}"
        )

