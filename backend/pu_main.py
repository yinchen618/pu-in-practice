"""
FastAPI 主應用 - PU Learning 模擬引擎
專門的 REST API 服務用於 PU 學習演算法模擬
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import traceback
import sys
import os

# 添加當前目錄到 Python 路徑
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, 'pu-learning'))

# 導入本地模組
try:
    from models import SimulationRequest, SimulationResponse
    from pulearning_engine import run_pu_simulation
except ImportError as e:
    print(f"Import error: {e}")
    print("Please make sure all dependencies are installed")
    
    # 創建基本的模型類以防止導入錯誤
    from pydantic import BaseModel
    from typing import List, Dict, Optional, Literal
    
    class DataParams(BaseModel):
        distribution: str = 'two_moons'
        dims: int = 2
        n_p: int = 50
        n_u: int = 300
        prior: float = 0.3
    
    class ModelParams(BaseModel):
        activation: str = 'relu'
        n_epochs: int = 50
        learning_rate: float = 0.01
        hidden_dim: int = 100
    
    class SimulationRequest(BaseModel):
        algorithm: str = 'nnPU'
        data_params: DataParams
        model_params: ModelParams
    
    class VisualizationData(BaseModel):
        p_samples: List[List[float]] = []
        u_samples: List[List[float]] = []
        decision_boundary: List[List[float]] = []
    
    class Metrics(BaseModel):
        estimated_prior: float = 0.3
        error_rate: float = 0.1
        risk_curve: List[Dict[str, float]] = []
    
    class SimulationResponse(BaseModel):
        visualization: VisualizationData
        metrics: Metrics
        success: bool = True
        message: Optional[str] = None

# 創建 FastAPI 應用
app = FastAPI(
    title="PU Learning Simulation Engine",
    description="A backend service for simulating uPU and nnPU algorithms",
    version="1.0.0"
)

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該設置具體的來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """根端點，返回服務信息"""
    return {
        "message": "PU Learning Simulation Engine is running!",
        "version": "1.0.0",
        "endpoints": {
            "simulation": "/api/run-simulation",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {"status": "healthy", "service": "pu-learning-engine"}


@app.post("/api/run-simulation", response_model=SimulationResponse)
async def handle_simulation(request: SimulationRequest):
    """
    處理 PU 學習模擬請求
    
    Args:
        request: 包含演算法類型、數據參數和模型參數的請求
    
    Returns:
        SimulationResponse: 包含可視化數據和評估指標的回應
    """
    try:
        print(f"Received simulation request:")
        print(f"  Algorithm: {request.algorithm}")
        print(f"  Distribution: {request.data_params.distribution}")
        print(f"  Dimensions: {request.data_params.dims}")
        print(f"  n_p: {request.data_params.n_p}, n_u: {request.data_params.n_u}")
        print(f"  Prior: {request.data_params.prior}")
        
        # 檢查是否能夠導入模擬引擎
        # 導入並使用真實的 PU Learning 引擎
        from pulearning_engine import run_pu_simulation
        print("✅ 成功導入 pulearning_engine")
        results = run_pu_simulation(request)
        print("✅ 成功執行 run_pu_simulation")
        
        # 構建回應
        response = SimulationResponse(
            visualization=results['visualization'],
            metrics=results['metrics'],
            success=True,
            message=f"Simulation completed successfully with {request.algorithm} algorithm"
        )
        
        print("✅ Simulation completed successfully!")
        return response
        
    except Exception as e:
        # 詳細的錯誤資訊
        error_message = f"Simulation failed: {str(e)}"
        error_traceback = traceback.format_exc()
        
        print(f"❌ Error: {error_message}")
        print(f"❌ Traceback: {error_traceback}")
        
        # 返回錯誤回應
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": error_message,
                "type": type(e).__name__
            }
        )


# 移除 MOCK 數據生成函數 - 只使用真實的 PU Learning 引擎


@app.get("/api/algorithms")
async def get_supported_algorithms():
    """獲取支援的演算法列表"""
    return {
        "algorithms": [
            {
                "name": "uPU",
                "full_name": "Unbiased PU Learning",
                "description": "Original PU learning method (ICML 2015)",
                "reference": "du Plessis et al., ICML 2015"
            },
            {
                "name": "nnPU", 
                "full_name": "Non-negative PU Learning",
                "description": "Improved PU learning with non-negative risk (NIPS 2017)",
                "reference": "Kiryo et al., NIPS 2017"
            }
        ]
    }


@app.get("/api/distributions")
async def get_supported_distributions():
    """獲取支援的數據分布列表"""
    return {
        "distributions": [
            {
                "name": "two_moons",
                "description": "Two interleaving half circles",
                "suitable_for": "Binary classification with curved decision boundary"
            },
            {
                "name": "gaussian",
                "description": "Two Gaussian clusters",
                "suitable_for": "Linear classification problems"
            },
            {
                "name": "spiral",
                "description": "Two interleaving spirals",
                "suitable_for": "Complex non-linear classification"
            },
            {
                "name": "complex",
                "description": "Complex synthetic dataset",
                "suitable_for": "High-dimensional classification problems"
            }
        ]
    }


# 開發用的啟動函數
def start_server():
    """啟動開發伺服器"""
    uvicorn.run(
        "pu_main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    start_server()
