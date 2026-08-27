#!/usr/bin/env bash

# ==============================================================================
# 🚀 Stock Price Prediction Full-Stack Web GUI Launcher
# ==============================================================================

# 색상 정의
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "============================================================"
echo "   📈 Stock Price Prediction AI - Full-Stack Web Dashboard   "
echo "============================================================"
echo -e "${NC}"

# 프로젝트 루트 경로
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# 1. Conda 가상환경 경로 확인
CONDA_PYTHON=""
for candidate in \
  "$HOME/miniconda3/envs/stock_pred/bin/python" \
  "$HOME/miniconda/envs/stock_pred/bin/python" \
  "$HOME/opt/miniconda3/envs/stock_pred/bin/python" \
  "/opt/homebrew/Caskroom/miniconda/base/envs/stock_pred/bin/python"
do
  if [ -f "$candidate" ]; then
    CONDA_PYTHON="$candidate"
    break
  fi
done

if [ -z "$CONDA_PYTHON" ]; then
  echo -e "${YELLOW}⚠️ 'stock_pred' 가상환경을 기본 경로에서 찾지 못했습니다. 활성화된 python을 사용합니다.${NC}"
  CONDA_PYTHON="python3"
fi

echo -e "${GREEN}✓ 파이썬 실행 경로: $CONDA_PYTHON${NC}"

# 2. 프로세스 종료 핸들러 설정
cleanup() {
  echo -e "\n${YELLOW}🛑 서버를 종료합니다...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. 백엔드 FastAPI 서버 시작 (Port: 8000)
echo -e "${CYAN}▶ [1/2] 백엔드 FastAPI 서버 시작 중... (http://localhost:8000)${NC}"
"$CONDA_PYTHON" "$ROOT_DIR/backend/run.py" &
BACKEND_PID=$!

# 백엔드 준비 대기
sleep 2

# 4. 프론트엔드 Vite 개발 서버 시작 (Port: 3101)
echo -e "${CYAN}▶ [2/2] 프론트엔드 GUI 서버 시작 중... (http://localhost:3101)${NC}"
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}============================================================${NC}"
echo -e "${GREEN} 🎉 풀스택 웹 애플리케이션이 성공적으로 구동되었습니다!${NC}"
echo -e "${GREEN} 👉 브라우저에서 아래 주소로 접속하세요:${NC}"
echo -e "${CYAN}    웹 대시보드:  http://localhost:3101${NC}"
echo -e "${CYAN}    API 문서:     http://localhost:8000/docs${NC}"
echo -e "${GREEN}============================================================${NC}"
echo -e "${YELLOW}(종료하려면 Ctrl + C 를 누르세요)${NC}\n"

# 백그라운드 프로세스 대기
wait
