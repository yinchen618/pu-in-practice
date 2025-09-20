#!/bin/bash

echo "🚀 啟動 Live Preview 功能測試"
echo "================================"

# 檢查 Python 是否安裝
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安裝，請先安裝 Python3"
    exit 1
fi

# 檢查必要的套件
echo "📦 檢查必要的套件..."
python3 -c "import fastapi, uvicorn, httpx" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 缺少必要的套件，請執行: pip install fastapi uvicorn httpx"
    exit 1
fi

# 切換到後端目錄
cd "$(dirname "$0")"

echo "🔧 啟動後端服務..."
echo "📝 服務將在 https://weakrisk.yinchen.tw 啟動"
echo "📖 API 文件將在 https://weakrisk.yinchen.tw/docs 提供"
echo ""

# 啟動後端服務
python3 main.py &

# 等待服務啟動
echo "⏳ 等待服務啟動..."
sleep 3

# 檢查服務是否正常運行
if curl -s https://weakrisk.yinchen.tw/ > /dev/null; then
    echo "✅ 後端服務啟動成功！"
else
    echo "❌ 後端服務啟動失敗"
    exit 1
fi

echo ""
echo "🧪 執行 Live Preview 功能測試..."
cd coding
python3 test_live_preview.py

echo ""
echo "🌐 測試完成！"
echo "📋 你可以在瀏覽器中開啟以下 URL 來測試："
echo "   - 後端服務: https://weakrisk.yinchen.tw"
echo "   - API 文件: https://weakrisk.yinchen.tw/docs"
echo "   - 測試檔案: https://weakrisk.yinchen.tw/live-preview/{sessionId}/test_live_preview.html"
echo ""
echo "💡 提示："
echo "   - 按 Ctrl+C 停止後端服務"
echo "   - 查看 coding_backend.log 獲取詳細日誌" 
