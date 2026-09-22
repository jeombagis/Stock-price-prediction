import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


class TestHealthEndpoints:
    """기본 헬스체크 및 루트 엔드포인트 테스트"""

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["version"] == "1.0.0"

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAssetsEndpoint:
    """자산 목록 API 테스트"""

    def test_get_assets(self):
        response = client.get("/api/assets")
        assert response.status_code == 200
        data = response.json()
        assert "presets" in data
        assert len(data["presets"]) == 2
        asset_ids = [a["id"] for a in data["presets"]]
        assert "SnP500" in asset_ids
        assert "Nasdaq100" in asset_ids


class TestPredictEndpoint:
    """예측 API 에러 케이스 테스트"""

    def test_unsupported_asset(self):
        response = client.get("/api/predict", params={"asset": "AAPL"})
        assert response.status_code == 400
        assert "지원하지 않는" in response.json()["detail"]


class TestRetrainEndpoint:
    """재학습 API 에러 케이스 테스트"""

    def test_unsupported_asset_retrain(self):
        response = client.post("/api/retrain", json={
            "asset_key_or_ticker": "INVALID",
            "window_size": 5,
            "threshold": 0.002,
            "train_split": 0.8,
            "fast_mode": True,
            "force_sync": False
        })
        assert response.status_code == 400

    def test_validation_error(self):
        """Pydantic 검증 실패 시 422 반환"""
        response = client.post("/api/retrain", json={
            "asset_key_or_ticker": "SnP500",
            "window_size": 100,  # ge=2, le=30 제약 위반
            "threshold": 0.002,
            "train_split": 0.8,
            "fast_mode": True
        })
        assert response.status_code == 422


class TestCORSHeaders:
    """CORS 보안 설정 테스트"""

    def test_allowed_origin(self):
        response = client.get("/health", headers={"Origin": "http://localhost:3101"})
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3101"

    def test_disallowed_origin(self):
        response = client.get("/health", headers={"Origin": "http://evil-site.com"})
        # Disallowed origin should not get CORS header
        assert response.headers.get("access-control-allow-origin") != "http://evil-site.com"


class TestFullPipelineIntegration:
    """실제 사전 학습 모델 및 데이터 연동 통합 테스트"""

    def test_predict_snp500_success(self):
        response = client.get("/api/predict", params={"asset": "SnP500"})
        assert response.status_code == 200
        data = response.json()
        assert data["asset_name"] == "S&P 500"
        assert data["ticker"] == "^GSPC"
        assert "overall_direction" in data
        assert "models" in data
        assert "Ensemble" in data["models"]
        assert 0.0 <= data["avg_probability"] <= 1.0

    def test_predict_nasdaq100_success(self):
        response = client.get("/api/predict", params={"asset": "Nasdaq100"})
        assert response.status_code == 200
        data = response.json()
        assert data["asset_name"] == "Nasdaq 100"
        assert data["ticker"] == "^NDX"

    def test_chart_data_success(self):
        response = client.get("/api/chart", params={"asset": "SnP500", "points": 60})
        assert response.status_code == 200
        data = response.json()
        assert len(data["points"]) <= 60
        assert len(data["points"]) > 0
        point = data["points"][-1]
        assert "close" in point
        assert "date" in point

    def test_feature_importance_success(self):
        response = client.get("/api/models/feature-importance", params={"asset": "SnP500", "model": "XGB"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["features"]) > 0
        assert data["features"][0]["importance"] >= 0.0

    def test_backtest_success(self):
        response = client.get("/api/backtest", params={"asset": "SnP500", "days": 20})
        assert response.status_code == 200
        data = response.json()
        assert data["total_days"] > 0
        assert 0.0 <= data["hit_ratio_pct"] <= 100.0
        assert len(data["history"]) > 0

    def test_retrain_different_window_size_graceful(self):
        """window_size!=5 요청 시 런타임 오류 없이 안전하게 5로 처리되어 성공하는지 검증"""
        response = client.post("/api/retrain", json={
            "asset_key_or_ticker": "SnP500",
            "window_size": 3,  # 모델 학습 시 5와 다르지만 서버 에러 없이 정상 처리되어야 함
            "threshold": 0.002,
            "train_split": 0.8,
            "fast_mode": True,
            "force_sync": False
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["prediction"]["parameters"]["window_size"] == 5

