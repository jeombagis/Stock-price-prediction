import os
import glob
from pathlib import Path
from datetime import datetime
from typing import Tuple, Optional
import pandas as pd
import yfinance as yf
from app.config import AppConfig, CACHE_DIR, DATA_DIR

class DataService:
    @staticmethod
    def get_stock_data(identifier: str, force_download: bool = False) -> Tuple[pd.DataFrame, str, str]:
        """
        주식 데이터를 반환합니다.
        Returns:
            df (pd.DataFrame): 'date', 'open', 'high', 'low', 'close', 'volume' 컬럼을 가진 DataFrame (오름차순 정렬)
            asset_name (str): 표시용 자산 이름
            ticker (str): 자산 티커
        """
        # 1. Preset 검사 (S&P 500 및 NASDAQ-100만 지원)
        asset_key = AppConfig.resolve_asset_key(identifier)
        if not asset_key or asset_key not in AppConfig.PRESET_ASSETS:
            raise ValueError(f"지원하지 않는 자산입니다: '{identifier}'. StockAlgo AI는 S&P 500(SnP500) 및 NASDAQ-100(Nasdaq100) 지수 분석 전용입니다.")

        preset_info = AppConfig.PRESET_ASSETS[asset_key]
        asset_name = preset_info["name"]
        ticker = preset_info["ticker"]
        csv_path = AppConfig.get_csv_for_preset(asset_key)

        cache_file = CACHE_DIR / f"{asset_key}_daily.csv"

        # 2. 캐시 확인 (강제 다운로드가 아닐 때 최신 캐시 우선 로드)
        if not force_download and cache_file.exists():
            df = DataService._load_local_csv(str(cache_file))
            if df is not None and len(df) >= 100:
                return df, asset_name, ticker

        # 3. 로컬 시드 CSV 확인 (캐시가 없고 강제 다운로드가 아닐 때)
        if not force_download and csv_path and os.path.exists(csv_path):
            df = DataService._load_local_csv(csv_path)
            return df, asset_name, ticker

        # 4. Yahoo Finance에서 최신 데이터 다운로드 (force_download 이거나 캐시가 없을 때)
        try:
            df = DataService._download_from_yfinance(ticker)
            if df is not None and not df.empty and len(df) >= 50:
                # 최신 캐시 저장
                df.to_csv(cache_file, index=False)
                return df, asset_name, ticker
        except Exception as err:
            print(f"yfinance download failed for {ticker}: {err}")

        # 다운로드 실패 시 캐시 파일 fallback
        if cache_file.exists():
            df = DataService._load_local_csv(str(cache_file))
            return df, asset_name, ticker

        # 로컬 시드 파일 fallback
        if csv_path and os.path.exists(csv_path):
            df = DataService._load_local_csv(csv_path)
            return df, asset_name, ticker

        raise ValueError(f"데이터를 가져올 수 없습니다: {identifier} ({ticker})")

    @staticmethod
    def _load_local_csv(file_path: str) -> pd.DataFrame:
        df = pd.read_csv(file_path)
        df.columns = [c.lower() for c in df.columns]
        
        # date 컬럼 형식 정리 (YYYYMMDD -> str)
        df['date'] = df['date'].astype(str).str.replace('-', '')
        df = df.sort_values(by='date', ascending=True).reset_index(drop=True)
        
        cols = ['open', 'high', 'low', 'close', 'volume']
        for col in cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        df = df.dropna(subset=cols).reset_index(drop=True)
        return df

    @staticmethod
    def _download_from_yfinance(ticker: str, start_date: str = "1970-01-01") -> Optional[pd.DataFrame]:
        end_date = datetime.now().strftime('%Y-%m-%d')
        try:
            df = yf.download(ticker, start=start_date, end=end_date, progress=False)
            if df is None or df.empty:
                return None

            # MultiIndex 컬럼 평탄화
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df = df.reset_index()
            df.rename(columns={
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            }, inplace=True)

            df = df[['date', 'open', 'high', 'low', 'close', 'volume']]
            df = df.dropna()
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y%m%d')
            df = df.sort_values(by='date', ascending=True).reset_index(drop=True)
            return df
        except Exception as e:
            print(f"Error downloading {ticker}: {e}")
            return None
