#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# StockMind — One-click setup
# Usage:  bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()    { echo -e "${CYAN}[info]${RESET}  $*"; }
success() { echo -e "${GREEN}[ok]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*"; exit 1; }

echo -e "${BOLD}"
echo "  ███████╗████████╗ ██████╗  ██████╗██╗  ██╗███╗   ███╗██╗███╗   ██╗██████╗"
echo "  ██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██║ ██╔╝████╗ ████║██║████╗  ██║██╔══██╗"
echo "  ███████╗   ██║   ██║   ██║██║     █████╔╝ ██╔████╔██║██║██╔██╗ ██║██║  ██║"
echo "  ╚════██║   ██║   ██║   ██║██║     ██╔═██╗ ██║╚██╔╝██║██║██║╚██╗██║██║  ██║"
echo "  ███████║   ██║   ╚██████╔╝╚██████╗██║  ██╗██║ ╚═╝ ██║██║██║ ╚████║██████╔╝"
echo "  ╚══════╝   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝"
echo -e "${RESET}"
echo -e "  Self-Correcting LSTM Stock Predictor\n"

# ── Check Python ──────────────────────────────────────────────
info "Checking Python..."
if ! command -v python3 &>/dev/null; then
  error "Python 3 not found. Install from https://python.org"
fi
PY_VER=$(python3 -c "import sys; print(sys.version_info[:2])")
info "Python: $(python3 --version)"

# ── Check Node ────────────────────────────────────────────────
info "Checking Node.js..."
if ! command -v node &>/dev/null; then
  error "Node.js not found. Install from https://nodejs.org"
fi
info "Node: $(node --version)"
info "npm:  $(npm --version)"

# ── Backend venv ──────────────────────────────────────────────
info "Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
  success "Virtual environment created"
else
  warn "venv already exists — skipping creation"
fi

source venv/bin/activate
info "Installing Python dependencies (this may take a few minutes)..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
success "Backend dependencies installed"
mkdir -p models charts
deactivate
cd ..

# ── Frontend ──────────────────────────────────────────────────
info "Installing frontend dependencies..."
cd frontend
npm install --silent
success "Frontend dependencies installed"
cd ..

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo -e "  ${BOLD}To start the app:${RESET}"
echo ""
echo -e "  Terminal 1 — Backend:"
echo -e "  ${CYAN}  cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000${RESET}"
echo ""
echo -e "  Terminal 2 — Frontend:"
echo -e "  ${CYAN}  cd frontend && npm run dev${RESET}"
echo ""
echo -e "  Then open ${BOLD}http://localhost:3000${RESET}"
echo ""
