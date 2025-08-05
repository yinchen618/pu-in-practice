from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_database
from routes.ammeters import ammeters_router
from routes.pu_learning import router as pu_learning_router
from routes.testbed import router as testbed_router
from routes.casestudy import router as casestudy_router
from ai_api import router as ai_router
import asyncio
import argparse
from cron_ammeter import start_cron, manual_fetch

# 注意：coding 相關的 API 端點現在由 coding/main.py 提供

app = FastAPI(title="AI 學習平台", description="基於 PyTorch 的互動式 AI 展示平台")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:3001","https://pu-in-practice.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含電表路由（整合後的統一路由）
app.include_router(ammeters_router)
# 包含 AI 路由
app.include_router(ai_router)
# 包含 PU Learning 路由
app.include_router(pu_learning_router)
# 包含 Testbed 路由
app.include_router(testbed_router)
# 包含 Case Study 路由
app.include_router(casestudy_router)

# 導入並包含完整的 coding 應用程式
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'coding'))
from coding.main import coding_router, session_router, files_router, live_preview_router

# 將 coding 應用程式的所有路由包含到主應用程式中
app.include_router(coding_router)
app.include_router(session_router)
app.include_router(files_router)
app.include_router(live_preview_router)

# 注意：coding 相關的 API 端點現在由 coding/main.py 提供
# 包括 /coding/chat, /coding/health, /live-preview/{session_id}/{file_path} 等

# 全域變數控制 cron 啟動
ENABLE_CRON = False

def set_cron_enabled(enabled: bool):
    """設定 cron 任務啟用狀態"""
    global ENABLE_CRON
    ENABLE_CRON = enabled

# 啟動事件 - 初始化資料庫
@app.on_event("startup")
async def startup_event():
    await init_database()
    
    # 只有在啟用 cron 時才啟動 cron 任務
    if ENABLE_CRON:
        print("啟動 cron 任務...")
        asyncio.create_task(start_cron())
    else:
        print("Cron 任務已停用")

@app.get("/")
async def root():
    return {
        "message": "AI 學習平台後端服務運行中", 
        "status": "active",
        "modules": {
            "ammeter": "電表數據管理",
            "ai": "AI 模型訓練與預測",
            "pu_learning": "PU Learning 模擬引擎",
            "coding": "AI 程式碼助手"
        },
        "endpoints": {
            "ammeter": "/api/ammeter",
            "ai": "/api/ai",
            "pu_learning": "/api/pu-learning",
            "testbed": "/api/testbed",
            "coding": "/coding",
            "docs": "/docs"
        }
    }

# 手動觸發電表資料抓取的端點
@app.post("/api/trigger-meter-fetch")
async def trigger_meter_fetch():
    """手動觸發電表資料抓取"""
    try:
        result = await manual_fetch()
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["message"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"電表資料抓取失敗: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    # 解析命令行參數
    parser = argparse.ArgumentParser(description="AI 學習平台後端服務")
    parser.add_argument(
        "--enable-cron", 
        action="store_true", 
        help="啟用 cron 任務（預設停用）"
    )
    parser.add_argument(
        "--host", 
        default="0.0.0.0", 
        help="服務器主機地址（預設: 0.0.0.0）"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=8000, 
        help="服務器端口（預設: 8000）"
    )
    
    args = parser.parse_args()
    
    # 設定全域變數
    set_cron_enabled(args.enable_cron)
    
    print(f"啟動 AI 學習平台後端服務...")
    print(f"主機: {args.host}")
    print(f"端口: {args.port}")
    print(f"Cron 任務: {'啟用' if ENABLE_CRON else '停用'}")
    print(f"包含模組: 電表管理, AI 訓練, PU Learning, Testbed, Coding Assistant")
    
    uvicorn.run(app, host=args.host, port=args.port)

"""
使用方式：

1. 預設啟動（不啟用 cron）
   python3 main.py

2. 啟用 cron 任務
   python3 main.py --enable-cron

3. 自定義主機和端口
   python3 main.py --host 127.0.0.1 --port 8080

4. 完整參數
   python3 main.py --enable-cron --host 0.0.0.0 --port 8000

參數說明：
- --enable-cron：啟用 cron 任務（預設停用）
- --host：服務器主機地址（預設：0.0.0.0）
- --port：服務器端口（預設：8000）

新增功能：
- Coding Assistant API：/coding/chat, /coding/health
"""
