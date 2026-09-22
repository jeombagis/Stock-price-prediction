import os
import sys
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# backend/ 디렉토리를 모듈 검색 경로에 추가
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENV", "development").lower() == "development"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=is_dev,
    )
