import os
import glob
from pathlib import Path

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT
SAVED_MODELS_DIR = PROJECT_ROOT / "saved_models"
CACHE_DIR = PROJECT_ROOT / "backend" / "data_cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

class AppConfig:
    WINDOW_SIZE: int = 5          # 과거 며칠간의 데이터를 특징(Feature)으로 사용할지
    THRESHOLD: float = 0.002      # '상승'으로 판단할 수익률 임계값 (0.2%)
    TRAIN_SPLIT: float = 0.8      # 학습 데이터 비율 (80%)
    
    # 지원 자산: S&P 500 및 NASDAQ-100 전용
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

    @classmethod
    def resolve_asset_key(cls, identifier: str) -> str | None:
        """
        자산 식별자(키 또는 티커)를 정규화된 자산 키('SnP500' 또는 'Nasdaq100')로 변환
        """
        if not identifier:
            return None
        cleaned = identifier.strip()
        if cleaned in cls.PRESET_ASSETS:
            return cleaned
        
        lower_cleaned = cleaned.lower()
        if lower_cleaned in ["snp500", "s&p500", "s&p 500", "^gspc", "gspc"]:
            return "SnP500"
        if lower_cleaned in ["nasdaq100", "nasdaq 100", "ndx", "^ndx", "qqq"]:
            return "Nasdaq100"
            
        return None

    @classmethod
    def get_csv_for_preset(cls, asset_key: str) -> str | None:
        norm_key = cls.resolve_asset_key(asset_key)
        if norm_key and norm_key in cls.PRESET_ASSETS:
            pattern = str(DATA_DIR / cls.PRESET_ASSETS[norm_key]["csv_pattern"])
            matches = glob.glob(pattern)
            if matches:
                return max(matches, key=os.path.getctime)
        return None
