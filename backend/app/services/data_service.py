import os
import glob
import logging
import time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Tuple, Optional
import pandas as pd
import yfinance as yf
from app.config import AppConfig, CACHE_DIR, DATA_DIR

logger = logging.getLogger(__name__)


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

        # 2. 캐시 확인 및 최신성 검사 (강제 다운로드가 아닐 때)
        cached_df = None
        if cache_file.exists():
            cached_df = DataService._load_local_csv(str(cache_file))

        if not force_download and cached_df is not None and len(cached_df) >= 100:
            today_str = datetime.now().strftime('%Y%m%d')
            last_date_str = str(cached_df['date'].iloc[-1])
            mtime_age = time.time() - cache_file.stat().st_mtime

            # 1) 오늘 거래일 데이터가 이미 캐시에 존재하거나,
            # 2) 최근 30분(1800초) 이내에 확인/갱신된 경우 즉시 캐시 반환 (불필요한 외부 API 호출 방지)
            if last_date_str == today_str or mtime_age < 1800:
                logger.info(f"[{asset_key}] 최신 캐시 데이터 로드 완료 ({len(cached_df):,}건, 기준일: {last_date_str})")
                return cached_df, asset_name, ticker

        # 3. 로컬 시드 CSV 확인 (캐시가 없고 강제 다운로드가 아닐 때)
        if not force_download and cached_df is None and csv_path and os.path.exists(csv_path):
            df = DataService._load_local_csv(csv_path)
            if df is not None and len(df) >= 100:
                logger.info(f"[{asset_key}] 시드 CSV 로드 완료 ({len(df):,}건): {csv_path}")
                return df, asset_name, ticker

        # 4. Yahoo Finance에서 최신 데이터 다운로드 (증분 갱신 또는 force_download)
        try:
            existing_df = cached_df if not force_download else None
            start_date = "1970-01-01"
            if existing_df is not None and len(existing_df) > 0:
                last_date_str = str(existing_df['date'].iloc[-1])
                try:
                    last_dt = datetime.strptime(last_date_str, '%Y%m%d')
                    start_date = (last_dt - timedelta(days=5)).strftime('%Y-%m-%d')
                    logger.info(f"[{asset_key}] 증분 업데이트: {start_date} 이후 데이터 다운로드 시도")
                except ValueError:
                    pass

            new_df = DataService._download_from_yfinance(ticker, start_date=start_date)
            if new_df is not None and not new_df.empty and len(new_df) >= 1:
                # 증분 병합
                if existing_df is not None and not force_download:
                    combined = pd.concat([existing_df, new_df], ignore_index=True)
                    combined = combined.drop_duplicates(subset=['date'], keep='last')
                    combined = combined.sort_values(by='date', ascending=True).reset_index(drop=True)
                    df = combined
                else:
                    df = new_df

                if len(df) >= 50:
                    # 최신 캐시 저장
                    df.to_csv(cache_file, index=False)
                    logger.info(f"[{asset_key}] Yahoo Finance 데이터 갱신 완료 ({len(df):,}건, 최신일: {df['date'].iloc[-1]})")
                    return df, asset_name, ticker
            else:
                # 새 데이터가 없더라도 캐시 파일의 mtime을 갱신하여 30분간 불필요한 재요청 방지
                if cache_file.exists():
                    os.utime(cache_file, None)
        except Exception as err:
            logger.error(f"[{asset_key}] yfinance 다운로드 실패: {err}", exc_info=True)

        # 다운로드 실패 시 캐시 파일 fallback
        if cached_df is not None and len(cached_df) >= 50:
            logger.warning(f"[{asset_key}] 다운로드 실패 -> 기존 캐시 fallback ({len(cached_df):,}건)")
            return cached_df, asset_name, ticker

        # 로컬 시드 파일 fallback
        if csv_path and os.path.exists(csv_path):
            df = DataService._load_local_csv(csv_path)
            logger.warning(f"[{asset_key}] 다운로드 실패 -> 시드 CSV fallback ({len(df):,}건)")
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
            logger.info(f"Yahoo Finance 다운로드: {ticker} ({start_date} ~ {end_date})")
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
            logger.error(f"Yahoo Finance 다운로드 에러 ({ticker}): {e}", exc_info=True)
            return None
