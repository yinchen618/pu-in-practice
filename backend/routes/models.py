"""
模型訓練 API 路由 - 處理 PU Learning 模型訓練
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Optional, Any, List
import logging
import uuid
from datetime import datetime

from services.training_service import training_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/models", tags=["Model Training"])

# Pydantic 模型
class ModelTrainingRequest(BaseModel):
    model_name: str
    model_type: str  # "uPU" or "nnPU"
    organization_id: str
    activation: Optional[str] = "relu"
    n_epochs: Optional[int] = 100
    n_estimators: Optional[int] = 100  # for nnPU RandomForest

class ModelTrainingResponse(BaseModel):
    success: bool
    task_id: str
    message: str
    estimated_completion_time: str

class ModelResultsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: str

class TaskStatusResponse(BaseModel):
    success: bool
    task_id: str
    status: str  # "pending", "running", "completed", "failed"
    progress: Optional[float] = None
    message: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# 全域訓練任務追蹤
training_tasks: Dict[str, Dict[str, Any]] = {}

@router.post("/train", response_model=ModelTrainingResponse)
async def train_model(
    request: ModelTrainingRequest,
    background_tasks: BackgroundTasks
):
    """
    觸發模型訓練（對應 "開始訓練" 按鈕）
    使用背景任務進行異步處理
    """
    try:
        logger.info(f"開始訓練 {request.model_type} 模型: {request.model_name}")
        
        # 驗證模型類型
        if request.model_type.lower() not in ['upu', 'nnpu']:
            raise HTTPException(status_code=400, detail="模型類型必須是 'uPU' 或 'nnPU'")
        
        # 生成任務ID
        task_id = str(uuid.uuid4())
        
        # 初始化任務狀態
        training_tasks[task_id] = {
            'status': 'pending',
            'progress': 0.0,
            'message': '正在準備模型訓練...',
            'start_time': datetime.utcnow(),
            'result': None,
            'error': None,
            'model_name': request.model_name,
            'model_type': request.model_type
        }
        
        # 準備模型參數
        model_params = {
            'activation': request.activation,
            'n_epochs': request.n_epochs,
            'n_estimators': request.n_estimators
        }
        
        # 啟動背景任務
        background_tasks.add_task(
            _train_model_background,
            task_id,
            request.model_name,
            request.model_type,
            request.organization_id,
            model_params
        )
        
        estimated_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        
        return ModelTrainingResponse(
            success=True,
            task_id=task_id,
            message=f"{request.model_type} 模型訓練任務已啟動",
            estimated_completion_time=estimated_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"啟動模型訓練失敗: {e}")
        raise HTTPException(status_code=500, detail=f"啟動訓練失敗: {str(e)}")

@router.get("/train/{task_id}/status", response_model=TaskStatusResponse)
async def get_training_status(task_id: str):
    """獲取模型訓練任務狀態"""
    if task_id not in training_tasks:
        raise HTTPException(status_code=404, detail="訓練任務不存在")
    
    task_info = training_tasks[task_id]
    
    return TaskStatusResponse(
        success=True,
        task_id=task_id,
        status=task_info['status'],
        progress=task_info.get('progress'),
        message=task_info['message'],
        result=task_info.get('result'),
        error=task_info.get('error')
    )

@router.get("/latest/results", response_model=ModelResultsResponse)
async def get_latest_model_results(organization_id: str):
    """
    獲取最新訓練成果（對應 "Results & Insights" 頁面載入）
    """
    try:
        logger.info(f"獲取組織 {organization_id} 的最新模型結果")
        
        # 從資料庫獲取最新模型結果
        latest_result = await training_service.get_latest_model_results(organization_id)
        
        if not latest_result:
            return ModelResultsResponse(
                success=True,
                data=None,
                message="尚未有已訓練的模型"
            )
        
        # 增強結果數據
        enhanced_result = {
            **latest_result,
            'performance_insights': _generate_performance_insights(latest_result),
            'recommendations': _generate_recommendations(latest_result)
        }
        
        return ModelResultsResponse(
            success=True,
            data=enhanced_result,
            message="成功獲取最新模型結果"
        )
        
    except Exception as e:
        logger.error(f"獲取模型結果失敗: {e}")
        raise HTTPException(status_code=500, detail=f"獲取結果失敗: {str(e)}")

@router.get("/all", response_model=ModelResultsResponse)
async def get_all_models(organization_id: str):
    """獲取所有已訓練的模型"""
    try:
        # 這裡可以實現獲取所有模型的邏輯
        # 暫時返回最新模型
        latest_result = await training_service.get_latest_model_results(organization_id)
        
        models_list = []
        if latest_result:
            models_list.append(latest_result)
        
        return ModelResultsResponse(
            success=True,
            data={'models': models_list, 'total': len(models_list)},
            message=f"成功獲取 {len(models_list)} 個模型"
        )
        
    except Exception as e:
        logger.error(f"獲取所有模型失敗: {e}")
        raise HTTPException(status_code=500, detail=f"獲取模型列表失敗: {str(e)}")

async def _train_model_background(
    task_id: str,
    model_name: str,
    model_type: str,
    organization_id: str,
    model_params: Dict[str, Any]
):
    """背景任務：訓練模型"""
    try:
        # 更新任務狀態
        training_tasks[task_id]['status'] = 'running'
        training_tasks[task_id]['message'] = '正在準備訓練數據...'
        training_tasks[task_id]['progress'] = 0.1
        
        # 檢查數據是否足夠
        training_tasks[task_id]['message'] = '正在檢查數據質量...'
        training_tasks[task_id]['progress'] = 0.2
        
        # 這裡可以添加數據質量檢查邏輯
        
        training_tasks[task_id]['message'] = f'正在訓練 {model_type} 模型...'
        training_tasks[task_id]['progress'] = 0.4
        
        # 執行實際的模型訓練
        model_id = await training_service.train_pu_model_in_background(
            model_name=model_name,
            model_type=model_type,
            organization_id=organization_id,
            model_params=model_params
        )
        
        training_tasks[task_id]['message'] = '正在評估模型性能...'
        training_tasks[task_id]['progress'] = 0.8
        
        # 獲取訓練結果
        model_result = await training_service.get_latest_model_results(organization_id)
        
        # 任務完成
        training_tasks[task_id]['status'] = 'completed'
        training_tasks[task_id]['message'] = f'模型 {model_name} 訓練完成'
        training_tasks[task_id]['progress'] = 1.0
        training_tasks[task_id]['result'] = {
            'model_id': model_id,
            'model_details': model_result,
            'completion_time': datetime.utcnow().isoformat(),
            'training_parameters': model_params
        }
        
        logger.info(f"模型訓練完成: {task_id}, 模型ID: {model_id}")
        
    except Exception as e:
        # 任務失敗
        error_msg = str(e)
        logger.error(f"模型訓練失敗: {task_id}, 錯誤: {error_msg}")
        
        training_tasks[task_id]['status'] = 'failed'
        training_tasks[task_id]['message'] = f'訓練失敗: {error_msg}'
        training_tasks[task_id]['error'] = error_msg
        training_tasks[task_id]['progress'] = 0.0

def _generate_performance_insights(model_result: Dict[str, Any]) -> Dict[str, Any]:
    """生成模型性能洞察"""
    precision = model_result.get('precision', 0)
    recall = model_result.get('recall', 0)
    f1_score = model_result.get('f1Score', 0)
    
    insights = {
        'overall_performance': 'good' if f1_score > 0.7 else 'moderate' if f1_score > 0.5 else 'poor',
        'precision_level': 'high' if precision > 0.8 else 'medium' if precision > 0.6 else 'low',
        'recall_level': 'high' if recall > 0.8 else 'medium' if recall > 0.6 else 'low',
        'balance_analysis': {
            'is_balanced': abs(precision - recall) < 0.1,
            'bias_towards': 'precision' if precision > recall + 0.1 else 'recall' if recall > precision + 0.1 else 'balanced'
        }
    }
    
    return insights

def _generate_recommendations(model_result: Dict[str, Any]) -> List[str]:
    """生成改進建議"""
    recommendations = []
    
    precision = model_result.get('precision', 0)
    recall = model_result.get('recall', 0)
    f1_score = model_result.get('f1Score', 0)
    
    if f1_score < 0.5:
        recommendations.append("模型性能較低，建議收集更多高質量的標註數據")
    
    if precision < 0.6:
        recommendations.append("精確度較低，可能存在過多假陽性，建議調整檢測閾值")
    
    if recall < 0.6:
        recommendations.append("召回率較低，可能遺漏真實異常，建議降低檢測閾值或增加異常樣本")
    
    if abs(precision - recall) > 0.2:
        recommendations.append("精確度和召回率不平衡，建議調整模型參數或重新平衡訓練數據")
    
    training_summary = model_result.get('trainingDataSummary', {})
    positive_samples = training_summary.get('positive_samples', 0)
    negative_samples = training_summary.get('reliable_negative_samples', 0)
    
    if positive_samples < 100:
        recommendations.append("正樣本數量較少，建議增加更多異常事件的標註")
    
    if negative_samples < 100:
        recommendations.append("負樣本數量較少，建議標註更多正常事件作為可靠負樣本")
    
    if not recommendations:
        recommendations.append("模型性能良好，可以考慮在更大的數據集上進一步驗證")
    
    return recommendations

@router.delete("/tasks/{task_id}")
async def cleanup_training_task(task_id: str):
    """清理已完成的訓練任務"""
    if task_id in training_tasks:
        del training_tasks[task_id]
        return {"success": True, "message": "訓練任務已清理"}
    else:
        raise HTTPException(status_code=404, detail="訓練任務不存在")

@router.get("/tasks")
async def list_training_tasks():
    """列出所有訓練任務狀態"""
    return {
        "success": True,
        "tasks": {
            task_id: {
                'status': info['status'],
                'message': info['message'],
                'progress': info.get('progress', 0),
                'model_name': info.get('model_name'),
                'model_type': info.get('model_type'),
                'start_time': info['start_time'].isoformat()
            }
            for task_id, info in training_tasks.items()
        }
    }
