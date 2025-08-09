"""
候選事件 API 路由 - 處理異常檢測和候選事件生成
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
import uuid
import asyncio
from datetime import datetime, date, timezone

from services.data_loader import data_loader
from services.anomaly_rules import anomaly_rules
from services.anomaly_service import anomaly_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/candidates", tags=["Candidate Events"])

# Enhanced Pydantic Models
class CandidateCalculationRequest(BaseModel):
    # Top-level filter
    start_date: date
    end_date: date
    # Optional precise datetime window (prioritized over date if provided)
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    
    # Value-based rules
    z_score_threshold: Optional[float] = 3.0
    spike_percentage: Optional[float] = 200.0
    
    # Time-based rules
    min_event_duration_minutes: Optional[int] = 30
    detect_holiday_pattern: Optional[bool] = True
    
    # Data integrity rules
    max_time_gap_minutes: Optional[int] = 60
    
    # Peer comparison rules
    peer_agg_window_minutes: Optional[int] = 5
    peer_exceed_percentage: Optional[float] = 150.0

class CandidateCalculationResponse(BaseModel):
    success: bool
    candidate_count: int
    message: str
    parameters_used: Dict[str, Any]
    processing_details: Optional[Dict[str, Any]] = None
    stats: Optional[Dict[str, Any]] = None

class CandidateGenerationRequest(CandidateCalculationRequest):
    """Same parameters as calculation but for actual generation"""
    pass

class CandidateGenerationResponse(BaseModel):
    success: bool
    task_id: str
    message: str
    estimated_completion_time: str

class TaskStatusResponse(BaseModel):
    success: bool
    task_id: str
    status: str  # "pending", "running", "completed", "failed"
    progress: Optional[float] = None
    message: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# 全域任務追蹤
running_tasks: Dict[str, Dict[str, Any]] = {}

@router.post("/calculate", response_model=CandidateCalculationResponse)
async def calculate_candidate_events(request: CandidateCalculationRequest):
    """
    Calculate candidate event count (Stage 1 parameter adjustment)
    Fast calculation without actually generating events
    """
    try:
        logger.info(f"Calculating candidate event count with parameters: {request.dict()}")
        
        # Normalize optional datetimes to UTC-naive for consistent comparison
        def to_utc_naive(dt: Optional[datetime]) -> Optional[datetime]:
            if dt is None:
                return None
            if dt.tzinfo is not None:
                return dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt

        start_dt = to_utc_naive(request.start_datetime)
        end_dt = to_utc_naive(request.end_datetime)

        # Get raw data with date/time filtering
        raw_df = await data_loader.get_raw_dataframe(
            start_date=request.start_date if start_dt is None else None,
            end_date=request.end_date if end_dt is None else None,
            start_datetime=start_dt,
            end_datetime=end_dt,
        )
        
        if raw_df.empty:
            return CandidateCalculationResponse(
                success=True,
                candidate_count=0,
                message="No data available for the specified date range",
                parameters_used=request.dict()
            )
        
        # Convert parameters for the detection engine
        detection_params = {
            'z_score_threshold': request.z_score_threshold,
            'spike_percentage': request.spike_percentage,
            'min_event_duration_minutes': request.min_event_duration_minutes,
            'detect_holiday_pattern': request.detect_holiday_pattern,
            'max_time_gap_minutes': request.max_time_gap_minutes,
            'peer_agg_window_minutes': request.peer_agg_window_minutes,
            'peer_exceed_percentage': request.peer_exceed_percentage,
        }
        
        # Calculate candidate event count using enhanced rules
        candidate_count = await anomaly_rules.calculate_candidate_count_enhanced(
            raw_df, detection_params
        )

        # Collect richer statistics for display
        stats = await anomaly_rules.calculate_candidate_stats_enhanced(raw_df, detection_params)
        
        # Prepare processing details
        processing_details = {
            'data_range': {
                'start_date': request.start_date.isoformat(),
                'end_date': request.end_date.isoformat(),
                'total_records': len(raw_df),
                'unique_devices': raw_df['deviceNumber'].nunique() if 'deviceNumber' in raw_df.columns else 0
            },
            'rules_applied': [
                'Value-based Z-Score Analysis',
                'Power Spike Detection',
                'Time-based Pattern Analysis',
                'Data Integrity Gap Detection',
                'Peer Comparison Analysis'
            ]
        }
        
        logger.info(f"Estimated candidate event count: {candidate_count}")
        
        return CandidateCalculationResponse(
            success=True,
            candidate_count=candidate_count,
            message=f"Estimated {candidate_count} candidate events will be generated",
            parameters_used=detection_params,
            processing_details=processing_details,
            stats=stats
        )
        
    except Exception as e:
        logger.error(f"Failed to calculate candidate events: {e}")
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")

@router.post("/generate", response_model=CandidateGenerationResponse)
async def generate_candidate_events(
    request: CandidateGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    生成並儲存候選事件（Stage 1 "Proceed" 按鈕）
    使用背景任務進行異步處理
    """
    try:
        logger.info(f"開始生成候選事件 - 案例研究模式")
        
        # 生成任務ID
        task_id = str(uuid.uuid4())
        
        # 初始化任務狀態
        running_tasks[task_id] = {
            'status': 'pending',
            'progress': 0.0,
            'message': '正在準備生成候選事件...',
            'start_time': datetime.utcnow(),
            'result': None,
            'error': None
        }
        
        # 啟動背景任務
        background_tasks.add_task(
            _generate_events_background,
            task_id,
            request.dict()
        )
        
        estimated_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        
        return CandidateGenerationResponse(
            success=True,
            task_id=task_id,
            message="候選事件生成任務已啟動",
            estimated_completion_time=estimated_time
        )
        
    except Exception as e:
        logger.error(f"啟動候選事件生成失敗: {e}")
        raise HTTPException(status_code=500, detail=f"啟動任務失敗: {str(e)}")

@router.get("/generate/{task_id}/status", response_model=TaskStatusResponse)
async def get_generation_status(task_id: str):
    """獲取候選事件生成任務狀態"""
    if task_id not in running_tasks:
        raise HTTPException(status_code=404, detail="任務不存在")
    
    task_info = running_tasks[task_id]
    
    return TaskStatusResponse(
        success=True,
        task_id=task_id,
        status=task_info['status'],
        progress=task_info.get('progress'),
        message=task_info['message'],
        result=task_info.get('result'),
        error=task_info.get('error')
    )

async def _generate_events_background(task_id: str, params: Dict[str, Any]):
    """背景任務：生成候選事件"""
    try:
        # 更新任務狀態
        running_tasks[task_id]['status'] = 'running'
        running_tasks[task_id]['message'] = '正在載入原始數據...'
        running_tasks[task_id]['progress'] = 0.1
        
        # 獲取原始數據
        raw_df = await data_loader.get_raw_dataframe()
        
        if raw_df.empty:
            raise Exception("沒有可用的原始數據")
        
        running_tasks[task_id]['message'] = '正在執行異常檢測...'
        running_tasks[task_id]['progress'] = 0.3
        
        # 提取檢測參數
        detection_params = {
            'zscore_threshold': params.get('zscore_threshold', 3.0),
            'time_window_hours': params.get('time_window_hours', 24),
            'min_duration_minutes': params.get('min_duration_minutes', 30),
            'power_threshold_multiplier': params.get('power_threshold_multiplier', 2.0),
            'night_hour_start': params.get('night_hour_start', 23),
            'night_hour_end': params.get('night_hour_end', 6)
        }
        
        # 執行異常檢測
        candidate_events_df = anomaly_rules.get_candidate_events(raw_df, detection_params)
        
        running_tasks[task_id]['message'] = '正在儲存候選事件到資料庫...'
        running_tasks[task_id]['progress'] = 0.7
        
        # 儲存事件到資料庫
        saved_count = 0
        
        for _, event in candidate_events_df.iterrows():
            try:
                # 建立數據窗口（模擬相關時間點的數據）
                event_time = event['timestamp']
                device_data = raw_df[
                    (raw_df['deviceNumber'] == event['deviceNumber']) &
                    (abs((raw_df['timestamp'] - event_time).dt.total_seconds()) <= 3600)  # ±1小時
                ].sort_values('timestamp')
                
                data_window = {
                    'timestamps': device_data['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist(),
                    'values': device_data['power'].tolist()
                }
                
                # 儲存到資料庫（案例研究模式不使用組織ID）
                await anomaly_service.create_anomaly_event(
                    event_id=f"AUTO_{event['deviceNumber']}_{event_time.strftime('%Y%m%d_%H%M%S')}",
                    meter_id=event['deviceNumber'],
                    event_timestamp=event_time,
                    detection_rule=event['detection_rule'],
                    score=float(event['score']),
                    data_window=data_window,
                    organization_id=None  # 案例研究不使用組織ID
                )
                
                saved_count += 1
                
            except Exception as e:
                logger.warning(f"儲存事件失敗: {e}")
                continue
        
        # 任務完成
        running_tasks[task_id]['status'] = 'completed'
        running_tasks[task_id]['message'] = f'成功生成並儲存 {saved_count} 個候選事件'
        running_tasks[task_id]['progress'] = 1.0
        running_tasks[task_id]['result'] = {
            'events_generated': saved_count,
            'total_candidates': len(candidate_events_df),
            'completion_time': datetime.utcnow().isoformat(),
            'detection_parameters': detection_params
        }
        
        logger.info(f"候選事件生成完成: {task_id}, 儲存了 {saved_count} 個事件")
        
    except Exception as e:
        # 任務失敗
        error_msg = str(e)
        logger.error(f"候選事件生成失敗: {task_id}, 錯誤: {error_msg}")
        
        running_tasks[task_id]['status'] = 'failed'
        running_tasks[task_id]['message'] = f'生成失敗: {error_msg}'
        running_tasks[task_id]['error'] = error_msg
        running_tasks[task_id]['progress'] = 0.0

@router.delete("/tasks/{task_id}")
async def cleanup_task(task_id: str):
    """清理已完成的任務"""
    if task_id in running_tasks:
        del running_tasks[task_id]
        return {"success": True, "message": "任務已清理"}
    else:
        raise HTTPException(status_code=404, detail="任務不存在")

@router.get("/tasks")
async def list_tasks():
    """列出所有任務狀態"""
    return {
        "success": True,
        "tasks": {
            task_id: {
                'status': info['status'],
                'message': info['message'],
                'progress': info.get('progress', 0),
                'start_time': info['start_time'].isoformat()
            }
            for task_id, info in running_tasks.items()
        }
    }
