"""
Pydantic 模型定義
用於    n_epochs: int = Field(50, ge=1, le=500, description="訓練輪數")
    learning_rate: float = Field(0.001, gt=0.0001, le=1.0, description="學習率")
    hidden_dim: int = Field(100, ge=10, le=500, description="隱藏層神經元數量")API 請求和回應的資料結構
"""
from pydantic import BaseModel, Field
from typing import Literal, List, Dict, Optional


class DataParams(BaseModel):
    """數據生成參數"""
    distribution: Literal['two_moons', 'gaussian', 'spiral', 'complex'] = 'two_moons'
    dims: int = Field(2, gt=1, le=100, description="數據維度")
    n_p: int = Field(50, gt=0, le=1000, description="正樣本數量")
    n_u: int = Field(300, gt=0, le=2000, description="未標記樣本數量")
    prior: float = Field(0.3, gt=0.05, lt=0.95, description="類別先驗機率")


class ModelParams(BaseModel):
    """模型參數"""
    activation: Literal['relu', 'softsign', 'tanh'] = 'relu'
    n_epochs: int = Field(50, gt=1, le=500, description="訓練週期數")
    learning_rate: float = Field(0.01, gt=0.001, lt=1.0, description="學習率")
    hidden_dim: int = Field(100, gt=10, le=500, description="隱藏層維度")


class SimulationRequest(BaseModel):
    """模擬請求"""
    algorithm: Literal['uPU', 'nnPU'] = 'nnPU'
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
