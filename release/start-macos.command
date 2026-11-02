#!/bin/sh
set -e
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "需要 Node.js 22 或更高版本，请先从 https://nodejs.org/ 安装。"
  printf "按回车退出..."
  read -r _
  exit 1
fi

node scripts/serve-dist.mjs 4173 &
SERVER_PID=$!
sleep 1
open "http://127.0.0.1:4173/"
wait "$SERVER_PID"
