"""
PU Learning API 路由
包含 PU 學習模擬的所有端點
"""
import sys
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
import traceback
import random
import math

# 添加 pu-learning 目錄到 Python 路徑
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
pu_learning_dir = os.path.join(backend_dir, 'pu-learning')
if pu_learning_dir not in sys.path:
    sys.path.insert(0, pu_learning_dir)

# 創建路由器
router = APIRouter(prefix="/api/pu-learning", tags=["pu-learning"])

# Pydantic 模型定義
class DataParams(BaseModel):
    """數據生成參數"""
    distribution: Literal['two_moons', 'gaussian', 'spiral', 'complex'] = 'two_moons'
    dims: int = Field(2, gt=1, le=100, description="數據維度")
    n_p: int = Field(50, gt=0, le=1000, description="正樣本數量")
    n_u: int = Field(300, gt=0, le=2000, description="未標記樣本數量")
    prior: float = Field(0.3, gt=0.05, lt=0.95, description="類別先驗機率")

class ModelParams(BaseModel):
    """模型參數 - 支援 uPU 和 nnPU 的不同參數"""
    # nnPU 參數
    activation: Optional[Literal['relu', 'softsign', 'tanh', 'sigmoid']] = 'relu'
    n_epochs: Optional[int] = Field(50, gt=1, le=500, description="訓練週期數")
    learning_rate: Optional[float] = Field(0.001, ge=0.00001, le=1.0, description="學習率")
    hidden_dim: Optional[int] = Field(100, ge=4, le=500, description="隱藏層維度")
    weight_decay: Optional[float] = Field(0.0, ge=0.0, le=0.1, description="權重衰減 (L2正規化)")
    
    # uPU 參數
    model_type: Optional[Literal['gauss', 'lm']] = 'gauss'
    use_bias: Optional[bool] = True
    n_basis: Optional[int] = Field(200, ge=10, le=500, description="基函數數量")

class SimulationRequest(BaseModel):
    """模擬請求"""
    algorithm: Literal['uPU', 'nnPU'] = 'nnPU'
    seed: Optional[int] = Field(42, ge=0, le=99999, description="隨機種子，用於確保實驗可重現性")
    prior_estimation_method: Optional[Literal['mean', 'median']] = Field('median', description="先驗估計方法")
    data_params: DataParams
    model_params: ModelParams

class VisualizationData(BaseModel):
    """可視化數據"""
    p_samples: List[List[float]] = Field(description="正樣本的 2D 座標")
    u_samples: List[List[float]] = Field(description="未標記樣本的 2D 座標")
    decision_boundary: List[List[float]] = Field(description="決策邊界的線段座標")

class Metrics(BaseModel):
    """評估指標"""
    estimated_prior: float = Field(description="估計的類別先驗")
    error_rate: float = Field(description="錯誤率")
    training_error_rate: float = Field(description="訓練錯誤率")
    risk_curve: List[Dict[str, float]] = Field(description="風險曲線數據")

class SimulationResponse(BaseModel):
    """模擬回應"""
    visualization: VisualizationData
    metrics: Metrics
    success: bool = True
    message: Optional[str] = None

# 移除 MOCK 數據生成函數 - 只使用真實的 PU Learning 引擎

@router.post("/run-simulation", response_model=SimulationResponse)
async def handle_simulation(request: SimulationRequest):
	"""
	處理 PU 學習模擬請求
	
	Args:
		request: 包含演算法類型、數據參數和模型參數的請求
	
	Returns:
		SimulationResponse: 包含可視化數據和評估指標的回應
	"""
	try:
		print(f"Processing simulation request for algorithm: {request.algorithm}")
		
		# 導入並使用真實的 PU Learning 引擎
		from pulearning_engine import run_pu_simulation
		
		# 執行 PU 學習模擬
		result = run_pu_simulation(request)
		
		return SimulationResponse(**result)
		
	except Exception as e:
		print(f"Error in PU Learning simulation: {e}")
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/algorithms")
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

@router.get("/distributions")
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

@router.get("/health")
async def pu_health_check():
    """PU Learning 模組健康檢查"""
    return {"status": "healthy", "module": "pu-learning"}
