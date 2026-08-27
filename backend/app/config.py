import os
import glob
from pathlib import Path

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT
CACHE_DIR = PROJECT_ROOT / "backend" / "data_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

class AppConfig:
    WINDOW_SIZE: int = 5          # 과거 며칠간의 데이터를 특징(Feature)으로 사용할지
    THRESHOLD: float = 0.002      # '상승'으로 판단할 수익률 임계값 (0.2%)
    TRAIN_SPLIT: float = 0.8      # 학습 데이터 비율 (80%)
    
    # 기본 프리셋 자산 및 티커 매핑
    PRESET_ASSETS = {
        "SnP500": {
            "name": "S&P 500",
            "ticker": "^GSPC",
            "description": "미국 대형주 500개 기업 지수",
            "csv_pattern": "SnP500_*.csv"
        },
        "Nasdaq100": {
            "name": "Nasdaq 100",
            "ticker": "^NDX",
            "description": "미국 기술주 100개 기업 지수",
            "csv_pattern": "Nasdaq100_*.csv"
        }
    }
    
    # 추천 인기 티커 목록
    POPULAR_TICKERS = [
        {"ticker": "^GSPC", "name": "S&P 500", "category": "Index"},
        {"ticker": "^NDX", "name": "Nasdaq 100", "category": "Index"},
        {"ticker": "^KS11", "name": "KOSPI", "category": "Index"},
        {"ticker": "^KQ11", "name": "KOSDAQ", "category": "Index"},
        {"ticker": "AAPL", "name": "Apple Inc.", "category": "Tech"},
        {"ticker": "NVDA", "name": "NVIDIA Corporation", "category": "AI/Tech"},
        {"ticker": "MSFT", "name": "Microsoft Corporation", "category": "Tech"},
        {"ticker": "TSLA", "name": "Tesla, Inc.", "category": "Auto/EV"},
        {"ticker": "GOOGL", "name": "Alphabet Inc.", "category": "Tech"},
        {"ticker": "AMZN", "name": "Amazon.com, Inc.", "category": "Tech/Retail"},
        {"ticker": "005930.KS", "name": "Samsung Electronics", "category": "Korea Semiconductor"}
    ]

    @classmethod
    def get_csv_for_preset(cls, asset_key: str) -> str | None:
        if asset_key in cls.PRESET_ASSETS:
            pattern = str(DATA_DIR / cls.PRESET_ASSETS[asset_key]["csv_pattern"])
            matches = glob.glob(pattern)
            if matches:
                return max(matches, key=os.path.getctime)
        return None
