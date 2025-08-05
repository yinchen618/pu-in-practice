#!/bin/bash

# 後端服務啟動腳本
echo "=== AI 學習平台後端服務啟動腳本 ==="

# 獲取腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 停止端口 8000 的服務
echo "正在停止端口 8000 的服務..."
"$PROJECT_ROOT/scripts/kill-port.sh" 8000

# 等待一下確保端口完全釋放
sleep 2

# 檢查端口是否已釋放
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "警告: 端口 8000 仍在使用中，請手動檢查"
else
    echo "端口 8000 已成功釋放"
fi

# 啟動後端服務
echo "正在啟動後端服務..."
cd "$SCRIPT_DIR"
python3 main.py

echo "後端服務已啟動完成" 
