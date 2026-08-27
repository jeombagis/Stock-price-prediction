import uvicorn
import os
import sys

# app 모듈 경로 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"🚀 Starting Stock Prediction AI Backend on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
