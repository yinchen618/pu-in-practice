#!/bin/bash

# Smart Meter Testbed 統一後端啟動腳本

echo "🚀 啟動智慧電表測試平台後端服務..."

# 檢查 Python 環境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安裝，請先安裝 Python3"
    exit 1
fi

# 檢查必要的 Python 套件
echo "📦 檢查必要套件..."
python3 -c "import fastapi, uvicorn, httpx, pydantic, sqlalchemy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  正在安裝必要套件..."
    pip3 install fastapi uvicorn httpx pydantic sqlalchemy
fi

# 切換到後端目錄
cd "$(dirname "$0")"

# 檢查必要檔案
if [ ! -f "meter.csv" ]; then
    echo "❌ meter.csv 檔案不存在，請確保檔案在當前目錄"
    exit 1
fi

if [ ! -f "database.py" ]; then
    echo "❌ database.py 檔案不存在，請確保檔案在當前目錄"
    exit 1
fi

if [ ! -f "testbed_service.py" ]; then
    echo "❌ testbed_service.py 檔案不存在，請確保檔案在當前目錄"
    exit 1
fi

echo "✅ 所有檔案檢查完成"
echo "🌐 啟動服務器於 https://weakrisk.yinchen.tw"
echo "📖 API 文檔可訪問: https://weakrisk.yinchen.tw/docs"
echo ""
echo "主要 API 端點:"
echo "  - GET  /api/testbed/overview         - 獲取概覽統計"
echo "  - GET  /api/testbed/units           - 獲取住宅單位清單"
echo "  - GET  /api/testbed/ammeter-history - 獲取電表歷史數據"
echo ""
echo "按 Ctrl+C 停止服務器"
echo "======================================="

# 啟動統一的 FastAPI 應用程序
python3 main_unified.py
