"""
實驗批次管理 API 路由 - 管理科學實驗的完整生命週期
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
import uuid
import asyncio
from datetime import datetime, date
import json

from services.data_loader import data_loader
from services.anomaly_rules import anomaly_rules
from services.anomaly_service import anomaly_service
from core.database import db_manager
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/experiment-runs", tags=["Experiment Runs"])

# ========== Pydantic Models ==========

class ExperimentRunCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ExperimentRunResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

class ExperimentRunListResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]]
    message: Optional[str] = None

class ExperimentRunUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class FilteringParameters(BaseModel):
    # Top-level filter
    start_date: date
    end_date: date
    
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

class CandidateGenerationRequest(BaseModel):
    filtering_parameters: FilteringParameters

# 全域任務追蹤
running_tasks: Dict[str, Dict[str, Any]] = {}

# ========== API Endpoints ==========

@router.post("", response_model=ExperimentRunResponse)
async def create_experiment_run(request: ExperimentRunCreate):
    """
    創建新的實驗批次
    """
    try:
        logger.info(f"Creating new experiment run: {request.name}")
        
        # 生成唯一 ID
        run_id = str(uuid.uuid4())
        
        # 插入到資料庫
        async with db_manager.get_async_session() as session:
            query = text("""
                INSERT INTO experiment_run (
                    id, name, description, status, "createdAt", "updatedAt"
                ) VALUES (
                    :id, :name, :description, 'CONFIGURING', NOW(), NOW()
                )
            """)
            
            await session.execute(query, {
                "id": run_id,
                "name": request.name,
                "description": request.description
            })
            await session.commit()
        
        # 構建回應
        experiment_run = {
            "id": run_id,
            "name": request.name,
            "description": request.description,
            "status": "CONFIGURING",
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        return ExperimentRunResponse(
            success=True,
            data=experiment_run,
            message=f"Successfully created experiment run: {request.name}"
        )
        
    except Exception as e:
        logger.error(f"Failed to create experiment run: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create experiment run: {str(e)}")

@router.get("", response_model=ExperimentRunListResponse)
async def list_experiment_runs(
    status: Optional[str] = Query(None, description="Status filter"),
    limit: int = Query(50, description="Number of results to return"),
    offset: int = Query(0, description="Number of results to skip")
):
    """
    列出實驗批次
    """
    try:
        async with db_manager.get_async_session() as session:
            # 構建查詢
            where_conditions = []
            params = {"limit": limit, "offset": offset}
            
            if status:
                where_conditions.append('status = :status')
                params["status"] = status
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            query = text(f"""
                SELECT 
                    id, name, description, status, "candidateCount", 
                    "positiveLabelCount", "negativeLabelCount",
                    "createdAt", "updatedAt"
                FROM experiment_run
                WHERE {where_clause}
                ORDER BY "createdAt" DESC
                LIMIT :limit OFFSET :offset
            """)
            
            result = await session.execute(query, params)
            rows = result.fetchall()
            
            experiment_runs = []
            for row in rows:
                experiment_runs.append({
                    "id": row.id,
                    "name": row.name,
                    "description": row.description,
                    "status": row.status,
                    "candidateCount": row.candidateCount,
                    "positiveLabelCount": row.positiveLabelCount,
                    "negativeLabelCount": row.negativeLabelCount,
                    "createdAt": row.createdAt.isoformat() if row.createdAt else None,
                    "updatedAt": row.updatedAt.isoformat() if row.updatedAt else None
                })
        
        return ExperimentRunListResponse(
            success=True,
            data=experiment_runs,
            message=f"Retrieved {len(experiment_runs)} experiment runs"
        )
        
    except Exception as e:
        logger.error(f"Failed to list experiment runs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list experiment runs: {str(e)}")

@router.patch("/{run_id}", response_model=ExperimentRunResponse)
async def update_experiment_run(run_id: str, request: ExperimentRunUpdate):
    """Update experiment run's name/description"""
    try:
        fields = []
        params: Dict[str, Any] = {"run_id": run_id}
        if request.name is not None:
            fields.append("name = :name")
            params["name"] = request.name
        if request.description is not None:
            fields.append("description = :description")
            params["description"] = request.description
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = text(f"""
            UPDATE experiment_run
            SET {', '.join(fields)}, "updatedAt" = NOW()
            WHERE id = :run_id
            RETURNING id, name, description, status, "filteringParameters",
                      "candidateCount", "positiveLabelCount", "negativeLabelCount",
                      "createdAt", "updatedAt"
        """)

        async with db_manager.get_async_session() as session:
            result = await session.execute(query, params)
            row = result.fetchone()
            await session.commit()

            if not row:
                raise HTTPException(status_code=404, detail="Experiment run not found")

            experiment_run = {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "status": row.status,
                "filteringParameters": row.filteringParameters,
                "candidateCount": row.candidateCount,
                "positiveLabelCount": row.positiveLabelCount,
                "negativeLabelCount": row.negativeLabelCount,
                "createdAt": row.createdAt.isoformat() if row.createdAt else None,
                "updatedAt": row.updatedAt.isoformat() if row.updatedAt else None
            }

        return ExperimentRunResponse(success=True, data=experiment_run, message="Experiment run updated")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update experiment run: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update experiment run: {str(e)}")

@router.delete("/{run_id}")
async def delete_experiment_run(run_id: str):
    """Delete an experiment run"""
    try:
        async with db_manager.get_async_session() as session:
            query = text("DELETE FROM experiment_run WHERE id = :run_id RETURNING id")
            result = await session.execute(query, {"run_id": run_id})
            row = result.fetchone()
            await session.commit()
            if not row:
                raise HTTPException(status_code=404, detail="Experiment run not found")
        return {"success": True, "message": "Experiment run deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete experiment run: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete experiment run: {str(e)}")

@router.get("/{run_id}", response_model=ExperimentRunResponse)
async def get_experiment_run(run_id: str):
    """
    獲取特定實驗批次的詳細資訊
    """
    try:
        async with db_manager.get_async_session() as session:
            query = text("""
                SELECT 
                    id, name, description, status, "filteringParameters",
                    "candidateCount", "positiveLabelCount", "negativeLabelCount",
                    "createdAt", "updatedAt"
                FROM experiment_run
                WHERE id = :run_id
            """)
            
            result = await session.execute(query, {"run_id": run_id})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Experiment run not found")
            
            # 派生標記統計（依事件表動態計算）
            counts_query = text(
                """
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'CONFIRMED_POSITIVE' THEN 1 END) as positive,
                    COUNT(CASE WHEN status = 'REJECTED_NORMAL' THEN 1 END) as negative
                FROM anomaly_event
                WHERE "experimentRunId" = :run_id
                """
            )
            counts_res = await session.execute(counts_query, {"run_id": run_id})
            counts_row = counts_res.fetchone()
            positive_cnt = counts_row.positive if counts_row and counts_row.positive is not None else 0
            negative_cnt = counts_row.negative if counts_row and counts_row.negative is not None else 0

            experiment_run = {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "status": row.status,
                "filteringParameters": row.filteringParameters,
                "candidateCount": row.candidateCount,
                "positiveLabelCount": positive_cnt,
                "negativeLabelCount": negative_cnt,
                "createdAt": row.createdAt.isoformat() if row.createdAt else None,
                "updatedAt": row.updatedAt.isoformat() if row.updatedAt else None
            }
        
        return ExperimentRunResponse(
            success=True,
            data=experiment_run,
            message="Successfully retrieved experiment run"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment run: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get experiment run: {str(e)}")

@router.put("/{run_id}/parameters", response_model=ExperimentRunResponse)
async def save_experiment_parameters(run_id: str, request: CandidateGenerationRequest):
    """
    儲存（僅儲存，不生成）Stage 1 的篩選參數到指定實驗批次
    """
    try:
        # 將日期欄位轉為 ISO 字串，避免 json 序列化錯誤
        filtering_params = request.filtering_parameters.dict()
        logger.info(f"[SaveParams] incoming filtering_parameters: {filtering_params}")
        # 正規化鍵名與可序列化：與生成流程一致
        if isinstance(filtering_params.get('start_date'), (date, datetime)):
            filtering_params['start_date'] = filtering_params['start_date'].isoformat()
        if isinstance(filtering_params.get('end_date'), (date, datetime)):
            filtering_params['end_date'] = filtering_params['end_date'].isoformat()

        def _stringify_dates(obj: Any) -> Any:
            if isinstance(obj, (date, datetime)):
                return obj.isoformat()
            if isinstance(obj, dict):
                return {k: _stringify_dates(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [_stringify_dates(v) for v in obj]
            return obj

        serializable_params = _stringify_dates(filtering_params)
        logger.info(f"[SaveParams] serializable filtering_parameters: {serializable_params}")

        async with db_manager.get_async_session() as session:
            update_query = text(
                """
                UPDATE experiment_run
                SET "filteringParameters" = :filtering_params, "updatedAt" = NOW()
                WHERE id = :run_id
                RETURNING id, name, description, status, "filteringParameters",
                          "candidateCount", "positiveLabelCount", "negativeLabelCount",
                          "createdAt", "updatedAt"
                """
            )
            result = await session.execute(update_query, {
                "run_id": run_id,
                "filtering_params": json.dumps(serializable_params)
            })
            row = result.fetchone()
            await session.commit()

            if not row:
                raise HTTPException(status_code=404, detail="Experiment run not found")

            # 動態計算標記統計
            counts_query = text(
                """
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'CONFIRMED_POSITIVE' THEN 1 END) as positive,
                    COUNT(CASE WHEN status = 'REJECTED_NORMAL' THEN 1 END) as negative
                FROM anomaly_event
                WHERE "experimentRunId" = :run_id
                """
            )
            counts_res = await session.execute(counts_query, {"run_id": run_id})
            counts_row = counts_res.fetchone()
            positive_cnt = counts_row.positive if counts_row and counts_row.positive is not None else 0
            negative_cnt = counts_row.negative if counts_row and counts_row.negative is not None else 0

            experiment_run = {
                "id": row.id,
                "name": row.name,
                "description": row.description,
                "status": row.status,
                "filteringParameters": row.filteringParameters,
                "candidateCount": row.candidateCount,
                "positiveLabelCount": positive_cnt,
                "negativeLabelCount": negative_cnt,
                "createdAt": row.createdAt.isoformat() if row.createdAt else None,
                "updatedAt": row.updatedAt.isoformat() if row.updatedAt else None
            }

        return ExperimentRunResponse(
            success=True,
            data=experiment_run,
            message="Filtering parameters saved"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save experiment parameters: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save experiment parameters: {str(e)}")

@router.post("/{run_id}/candidates/generate")
async def generate_candidates_for_experiment(
    run_id: str,
    request: CandidateGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    為特定實驗批次生成候選事件（Stage 1 → Stage 2）
    """
    try:
        logger.info(f"Generating candidates for experiment run: {run_id}")
        
        # 驗證實驗批次存在
        async with db_manager.get_async_session() as session:
            check_query = text("SELECT status FROM experiment_run WHERE id = :run_id")
            result = await session.execute(check_query, {"run_id": run_id})
            row = result.fetchone()
            
            if not row:
                raise HTTPException(status_code=404, detail="Experiment run not found")
            
            # 允許在 CONFIGURING 或 LABELING 狀態重新生成（覆蓋舊資料）
            if row.status not in ("CONFIGURING", "LABELING"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot generate candidates for experiment in status: {row.status}"
                )
        
        # 生成任務 ID
        task_id = str(uuid.uuid4())
        
        # 初始化任務狀態
        running_tasks[task_id] = {
            'experiment_run_id': run_id,
            'status': 'pending',
            'progress': 0.0,
            'message': '正在準備生成候選事件...',
            'start_time': datetime.utcnow(),
            'result': None,
            'error': None
        }
        
        # 啟動背景任務
        background_tasks.add_task(
            _generate_candidates_background,
            task_id,
            run_id,
            request.filtering_parameters.dict()
        )
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "候選事件生成任務已啟動",
            "experiment_run_id": run_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start candidate generation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start candidate generation: {str(e)}")

@router.get("/{run_id}/candidates/status/{task_id}")
async def get_generation_status(run_id: str, task_id: str):
    """
    獲取候選事件生成任務狀態
    """
    if task_id not in running_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = running_tasks[task_id]
    
    if task_info['experiment_run_id'] != run_id:
        raise HTTPException(status_code=400, detail="Task does not belong to this experiment run")
    
    return {
        "success": True,
        "task_id": task_id,
        "experiment_run_id": run_id,
        "status": task_info['status'],
        "progress": task_info.get('progress'),
        "message": task_info['message'],
        "result": task_info.get('result'),
        "error": task_info.get('error')
    }

async def _generate_candidates_background(task_id: str, run_id: str, filtering_params: Dict[str, Any]):
    """
    背景任務：為特定實驗批次生成候選事件
    """
    try:
        # 更新任務狀態
        running_tasks[task_id]['status'] = 'running'
        running_tasks[task_id]['message'] = '正在載入原始數據...'
        running_tasks[task_id]['progress'] = 0.1
        
        # 解析日期（若已是 date 物件則直接使用）
        def _to_date(v: Any) -> date:
            if isinstance(v, date):
                return v
            if isinstance(v, str):
                return date.fromisoformat(v)
            raise ValueError("Invalid date value in filtering_parameters")

        start_d = _to_date(filtering_params.get('start_date'))
        end_d = _to_date(filtering_params.get('end_date'))

        logger.info(f"[Generate] filtering_params: {filtering_params}")
        # 獲取原始數據
        raw_df = await data_loader.get_raw_dataframe(
            start_date=start_d,
            end_date=end_d,
        )
        
        if raw_df.empty:
            raise Exception("指定日期範圍內沒有可用的原始數據")
        
        running_tasks[task_id]['message'] = '正在執行異常檢測...'
        running_tasks[task_id]['progress'] = 0.3
        
        # 執行異常檢測（鍵名正規化：與規則引擎期望一致）
        normalized_params = dict(filtering_params)
        # 將 z_score_threshold -> zscore_threshold
        if 'z_score_threshold' in normalized_params and 'zscore_threshold' not in normalized_params:
            normalized_params['zscore_threshold'] = normalized_params['z_score_threshold']
        # 將 min_event_duration_minutes -> min_duration_minutes
        if 'min_event_duration_minutes' in normalized_params and 'min_duration_minutes' not in normalized_params:
            normalized_params['min_duration_minutes'] = normalized_params['min_event_duration_minutes']
        # 其他鍵已與規則引擎一致，例如 spike_percentage, detect_holiday_pattern, max_time_gap_minutes

        logger.info(f"[Generate] normalized_params: {normalized_params}")
        candidate_events_df = anomaly_rules.get_candidate_events(raw_df, normalized_params)
        
        running_tasks[task_id]['message'] = '正在儲存實驗參數和候選事件到資料庫...'
        running_tasks[task_id]['progress'] = 0.7
        
        # 更新實驗批次的篩選參數和狀態
        async with db_manager.get_async_session() as session:
            # 更新實驗批次
            update_run_query = text("""
                UPDATE experiment_run 
                SET "filteringParameters" = :filtering_params,
                    status = 'LABELING',
                    "candidateCount" = :candidate_count,
                    "updatedAt" = NOW()
                WHERE id = :run_id
            """)
            
            # 確保存入 DB 的 JSON 可序列化（日期轉字串）
            def _stringify_dates(obj: Any) -> Any:
                if isinstance(obj, (date, datetime)):
                    return obj.isoformat()
                if isinstance(obj, dict):
                    return {k: _stringify_dates(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [_stringify_dates(v) for v in obj]
                return obj

            serializable_params = _stringify_dates(filtering_params)

            await session.execute(update_run_query, {
                "run_id": run_id,
                "filtering_params": json.dumps(serializable_params),
                "candidate_count": len(candidate_events_df)
            })
            await session.commit()

        # 重新生成前，刪除舊的候選事件以免殘留
        async with db_manager.get_async_session() as session:
            await session.execute(text('DELETE FROM anomaly_event WHERE "experimentRunId" = :run_id'), {"run_id": run_id})
            await session.commit()

        # 儲存候選事件到資料庫
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
                
                # 儲存到資料庫，關聯到實驗批次
                await anomaly_service.create_anomaly_event(
                    event_id=f"EXP_{run_id[:8]}_{event['deviceNumber']}_{event_time.strftime('%Y%m%d_%H%M%S')}",
                    meter_id=event['deviceNumber'],
                    event_timestamp=event_time,
                    detection_rule=event['detection_rule'],
                    score=float(event['score']),
                    data_window=data_window,
                    organization_id="default-org",  # 案例研究使用預設組織
                    experiment_run_id=run_id  # 關聯到實驗批次
                )
                
                saved_count += 1
                
            except Exception as e:
                logger.warning(f"儲存事件失敗: {e}")
                continue
        
        # 任務完成
        running_tasks[task_id]['status'] = 'completed'
        running_tasks[task_id]['message'] = f'成功生成並儲存 {saved_count} 個候選事件到實驗批次 {run_id}'
        running_tasks[task_id]['progress'] = 1.0
        running_tasks[task_id]['result'] = {
            'experiment_run_id': run_id,
            'events_generated': saved_count,
            'total_candidates': len(candidate_events_df),
            'completion_time': datetime.utcnow().isoformat(),
            'filtering_parameters': filtering_params
        }
        
        logger.info(f"候選事件生成完成: {task_id}, 實驗批次: {run_id}, 儲存了 {saved_count} 個事件")
        
    except Exception as e:
        # 任務失敗
        error_msg = str(e)
        logger.error(f"候選事件生成失敗: {task_id}, 實驗批次: {run_id}, 錯誤: {error_msg}")
        
        running_tasks[task_id]['status'] = 'failed'
        running_tasks[task_id]['message'] = f'生成失敗: {error_msg}'
        running_tasks[task_id]['error'] = error_msg
        running_tasks[task_id]['progress'] = 0.0
