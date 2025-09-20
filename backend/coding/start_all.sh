#!/bin/bash

echo "🚀 AI Coding Assistant 完整啟動腳本"
echo "=================================="

# 檢查 Ollama 是否已安裝
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama 未安裝，請先安裝 Ollama: https://ollama.ai/"
    exit 1
fi

# 檢查 deepseek-coder 模型是否存在
echo "🔍 檢查 deepseek-coder 模型..."
if ! ollama list | grep -q "deepseek-coder"; then
    echo "📥 下載 deepseek-coder 模型..."
    ollama pull deepseek-coder
else
    echo "✅ deepseek-coder 模型已存在"
fi

# 啟動 Ollama 服務（如果未運行）
echo "🔧 啟動 Ollama 服務..."
ollama run deepseek-coder &
OLLAMA_PID=$!

# 等待 Ollama 服務啟動
echo "⏳ 等待 Ollama 服務啟動..."
sleep 5

# 檢查 Ollama 服務是否正常運行
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama 服務運行正常"
else
    echo "❌ Ollama 服務啟動失敗"
    exit 1
fi

# 啟動 FastAPI 後端
echo "🌐 啟動 FastAPI 後端服務..."
python start_server.py &
API_PID=$!

# 等待後端服務啟動
echo "⏳ 等待後端服務啟動..."
sleep 3

# 測試 API 是否正常運行
echo "🧪 測試 API 服務..."
python test_api.py

echo ""
echo "🎉 所有服務已啟動！"
echo "📋 服務狀態："
echo "   - Ollama 服務: http://localhost:11434"
echo "   - FastAPI 後端: https://weakrisk.yinchen.tw"
echo "   - API 文件: https://weakrisk.yinchen.tw/docs"
echo "   - 健康檢查: https://weakrisk.yinchen.tw/coding/health"
echo ""
echo "💡 前端可以運行: cd ../../apps/livecoding && pnpm dev"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
trap "echo '🛑 停止所有服務...'; kill $OLLAMA_PID $API_PID 2>/dev/null; exit" INT
wait 
