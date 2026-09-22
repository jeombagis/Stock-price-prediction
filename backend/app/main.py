import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import router as api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작/종료 시 리소스 관리"""
    logger.info("StockPred AI 서버를 시작합니다...")
    yield
    logger.info("StockPred AI 서버를 종료합니다.")


app = FastAPI(
    title="Stock Price Prediction AI API",
    description="Machine Learning & Ensemble based Stock Price Movement Prediction Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS 설정 (보안: 허용된 오리진만 허용)
_default_origins = [
    "http://localhost:3101",
    "http://127.0.0.1:3101",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_env_origins = os.environ.get("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"▶ {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"◀ {request.method} {request.url.path} [{response.status_code}]")
    return response


from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Pydantic 유효성 검사 실패 시 읽기 쉬운 detail 메시지 반환"""
    errors = exc.errors()
    msg_list = [f"{'.'.join(str(l) for l in err.get('loc', []))}: {err.get('msg')}" for err in errors]
    detail_str = "입력값 검증 실패: " + ", ".join(msg_list)
    logger.warning(f"Validation error: {detail_str}")
    return JSONResponse(
        status_code=422,
        content={"detail": detail_str},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """처리되지 않은 예외를 안전한 JSON 응답으로 변환"""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"서버 내부 오류: {str(exc)}",
            "error_type": type(exc).__name__,
        },
    )


# API 라우터 등록
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Stock Price Prediction AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
