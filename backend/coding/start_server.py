#!/usr/bin/env python3
"""
啟動 AI Coding Assistant 後端服務
"""

import uvicorn
import sys
import os

# 添加父目錄到 Python 路徑，以便導入主應用程式
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

if __name__ == "__main__":
    print("🚀 啟動 AI Coding Assistant 後端服務")
    print("📋 請確認以下事項：")
    print("   1. Ollama 服務正在運行")
    print("   2. 已安裝 deepseek-coder 模型")
    print("   3. 執行: ollama run deepseek-coder")
    print("")
    print("🌐 API 文件: http://localhost:8000/docs")
    print("🔗 健康檢查: http://localhost:8000/coding/health")
    print("")
    
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000,
            reload=False,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 服務已停止")
    except Exception as e:
        print(f"❌ 啟動失敗: {e}")
        sys.exit(1) 
