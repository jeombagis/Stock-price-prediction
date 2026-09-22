import pytest
from app.config import AppConfig


class TestResolveAssetKey:
    """AppConfig.resolve_asset_key() 자산 식별자 정규화 테스트"""

    def test_direct_key_snp500(self):
        assert AppConfig.resolve_asset_key("SnP500") == "SnP500"

    def test_direct_key_nasdaq100(self):
        assert AppConfig.resolve_asset_key("Nasdaq100") == "Nasdaq100"

    def test_ticker_gspc(self):
        assert AppConfig.resolve_asset_key("^GSPC") == "SnP500"

    def test_ticker_ndx(self):
        assert AppConfig.resolve_asset_key("^NDX") == "Nasdaq100"

    def test_case_insensitive_snp(self):
        assert AppConfig.resolve_asset_key("snp500") == "SnP500"
        assert AppConfig.resolve_asset_key("s&p 500") == "SnP500"
        assert AppConfig.resolve_asset_key("S&P500") == "SnP500"

    def test_case_insensitive_nasdaq(self):
        assert AppConfig.resolve_asset_key("nasdaq100") == "Nasdaq100"
        assert AppConfig.resolve_asset_key("qqq") == "Nasdaq100"
        assert AppConfig.resolve_asset_key("NDX") == "Nasdaq100"

    def test_unsupported_returns_none(self):
        assert AppConfig.resolve_asset_key("AAPL") is None
        assert AppConfig.resolve_asset_key("KOSPI") is None
        assert AppConfig.resolve_asset_key("") is None

    def test_whitespace_handling(self):
        assert AppConfig.resolve_asset_key("  SnP500  ") == "SnP500"
        assert AppConfig.resolve_asset_key(" ^GSPC ") == "SnP500"

    def test_none_input(self):
        assert AppConfig.resolve_asset_key(None) is None
