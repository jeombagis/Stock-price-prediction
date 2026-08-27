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
        # 1. Preset 검사
        preset_info = AppConfig.PRESET_ASSETS.get(identifier)
        if preset_info:
            asset_name = preset_info["name"]
            ticker = preset_info["ticker"]
            csv_path = AppConfig.get_csv_for_preset(identifier)
            
            if csv_path and os.path.exists(csv_path) and not force_download:
                df = DataService._load_local_csv(csv_path)
                return df, asset_name, ticker
        else:
            # 커스텀 티커로 처리
            ticker = identifier.strip().upper()
            asset_name = ticker

        # 2. 캐시 확인
        cache_file = CACHE_DIR / f"{ticker.replace('^', 'INDEX_').replace('.', '_')}_daily.csv"
        if cache_file.exists() and not force_download:
            # 캐시가 오늘 다운로드된 것이면 바로 사용
            mod_time = datetime.fromtimestamp(os.path.getmtime(cache_file))
            if mod_time.date() == datetime.now().date():
                df = DataService._load_local_csv(str(cache_file))
                return df, asset_name, ticker

        # 3. Yahoo Finance에서 다운로드
        df = DataService._download_from_yfinance(ticker)
        if df is not None and not df.empty:
            # 캐시 저장
            df.to_csv(cache_file, index=False)
            return df, asset_name, ticker

        # 다운로드 실패 시 캐시 파일이 있으면 그거라도 반환
        if cache_file.exists():
            df = DataService._load_local_csv(str(cache_file))
            return df, asset_name, ticker

        # 프리셋 로컬 파일이 있으면 fallback
        if preset_info:
            csv_path = AppConfig.get_csv_for_preset(identifier)
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
