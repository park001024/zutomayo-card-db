#!/usr/bin/env bash
# 로컬 미리보기: http://localhost:8765
cd "$(dirname "$0")/.."
PORT="${1:-8765}"
echo "http://localhost:$PORT  (Ctrl+C 로 종료)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
