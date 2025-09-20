#!/bin/bash

# PU Learning 整合後的快速啟動腳本

echo "🚀 啟動 AI 學習平台 (包含 PU Learning)"
echo "=================================="

# 檢查當前目錄
if [ ! -f "main.py" ]; then
    echo "❌ 錯誤: 請在 backend 目錄中運行此腳本"
    exit 1
fi

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 錯誤: 找不到 python3"
    exit 1
fi

echo "✅ Python3 已找到"

# 檢查依賴
echo "🔍 檢查依賴..."
python3 -c "import fastapi, uvicorn, torch, numpy" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ 基本依賴已安裝"
else
    echo "⚠️  某些依賴可能缺失，但服務仍可運行 (將使用模擬模式)"
fi

# 啟動服務
echo ""
echo "🔥 啟動服務..."
echo "服務地址: https://weakrisk.yinchen.tw"
echo "API 文檔: https://weakrisk.yinchen.tw/docs"
echo "PU Learning 前端: http://localhost:3001/pu-learning"
echo ""
echo "按 Ctrl+C 停止服務"
echo "=================================="

python3 main.py
