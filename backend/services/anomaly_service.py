"""
Anomaly Service - 異常檢測和案例研究服務
整合資料庫查詢函數，提供異常事件和標籤管理功能
"""

from typing import List, Dict, Optional, Any
from datetime import datetime, date
from pydantic import BaseModel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from core.database import db_manager
from sqlalchemy import text
import json

# ========== 資料模型 ==========
class AnomalyEventModel(BaseModel):
    id: str
    eventId: str
    meterId: str
    eventTimestamp: datetime
    detectionRule: str
    score: float
    dataWindow: Dict[str, Any]
    status: str = "UNREVIEWED"
    reviewerId: Optional[str] = None
    reviewTimestamp: Optional[datetime] = None
    justificationNotes: Optional[str] = None
    organizationId: str
    createdAt: datetime
    updatedAt: datetime

class AnomalyLabelModel(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    organizationId: str
    createdAt: datetime
    updatedAt: datetime

class AnomalyStatsModel(BaseModel):
    totalEvents: int
    unreviewedCount: int
    confirmedCount: int
    rejectedCount: int
    avgScore: float
    maxScore: float
    uniqueMeters: int

class AnomalyEventsResponse(BaseModel):
    events: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    totalPages: int

# ========== 服務類 ==========
class AnomalyService:
    """異常檢測服務 - 管理異常事件和標籤"""
    
    async def get_anomaly_events(
        self,
        organization_id: str,
        status: Optional[str] = None,
        meter_id: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> AnomalyEventsResponse:
        """獲取異常事件列表（分頁）"""
        
        # 構建 WHERE 條件
        where_conditions = ["organization_id = :organization_id"]
        params = {"organization_id": organization_id}
        
        if status:
            where_conditions.append("status = :status")
            params["status"] = status
            
        if meter_id:
            where_conditions.append("meter_id = :meter_id")
            params["meter_id"] = meter_id
            
        if search:
            where_conditions.append("(detection_rule ILIKE :search OR justification_notes ILIKE :search)")
            params["search"] = f"%{search}%"
            
        if date_from:
            where_conditions.append("event_timestamp >= :date_from")
            params["date_from"] = date_from
            
        if date_to:
            where_conditions.append("event_timestamp <= :date_to")
            params["date_to"] = date_to
        
        where_clause = " AND ".join(where_conditions)
        
        # 計算總記錄數
        count_query = f"""
            SELECT COUNT(*) as total
            FROM anomaly_event
            WHERE {where_clause}
        """
        
        # 獲取分頁結果（排除大型 dataWindow 欄位）
        offset = (page - 1) * limit
        data_query = f"""
            SELECT 
                id, event_id, meter_id, event_timestamp, detection_rule, score,
                status, reviewer_id, review_timestamp, justification_notes,
                organization_id, created_at, updated_at
            FROM anomaly_event
            WHERE {where_clause}
            ORDER BY event_timestamp DESC
            LIMIT :limit OFFSET :offset
        """
        
        params["limit"] = limit
        params["offset"] = offset
        
        async with db_manager.get_session() as session:
            # 獲取總數
            count_result = await session.execute(text(count_query), params)
            total = count_result.scalar() or 0
            
            # 獲取事件資料
            events_result = await session.execute(text(data_query), params)
            events = [dict(row._mapping) for row in events_result]
        
        total_pages = (total + limit - 1) // limit
        
        return AnomalyEventsResponse(
            events=events,
            total=total,
            page=page,
            limit=limit,
            totalPages=total_pages
        )
    
    async def get_anomaly_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """獲取單個異常事件詳情（包含 dataWindow）"""
        
        query = """
            SELECT *
            FROM anomaly_event
            WHERE id = :event_id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"event_id": event_id})
            event = result.first()
        
        if event:
            event_data = dict(event._mapping)
            # 如果 dataWindow 是 JSON 字符串，解析它
            if isinstance(event_data.get('data_window'), str):
                try:
                    event_data['data_window'] = json.loads(event_data['data_window'])
                except:
                    pass
            return event_data
        return None
    
    async def create_anomaly_event(
        self,
        event_id: str,
        meter_id: str,
        event_timestamp: datetime,
        detection_rule: str,
        score: float,
        data_window: Dict[str, Any],
        organization_id: str
    ) -> Dict[str, Any]:
        """創建新的異常事件"""
        
        # 生成 UUID
        import uuid
        new_id = str(uuid.uuid4())
        
        query = """
            INSERT INTO anomaly_event 
            (id, event_id, meter_id, event_timestamp, detection_rule, score, data_window, organization_id, created_at, updated_at)
            VALUES (:id, :event_id, :meter_id, :event_timestamp, :detection_rule, :score, :data_window, :organization_id, NOW(), NOW())
            RETURNING *
        """
        
        params = {
            "id": new_id,
            "event_id": event_id,
            "meter_id": meter_id,
            "event_timestamp": event_timestamp,
            "detection_rule": detection_rule,
            "score": score,
            "data_window": json.dumps(data_window),
            "organization_id": organization_id
        }
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), params)
            await session.commit()
            event = result.first()
        
        return dict(event._mapping)
    
    async def review_anomaly_event(
        self,
        event_id: str,
        status: str,
        reviewer_id: str,
        justification_notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """審核異常事件"""
        
        query = """
            UPDATE anomaly_event
            SET status = :status, reviewer_id = :reviewer_id, review_timestamp = NOW(), 
                justification_notes = :justification_notes, updated_at = NOW()
            WHERE id = :event_id
            RETURNING *
        """
        
        params = {
            "event_id": event_id,
            "status": status,
            "reviewer_id": reviewer_id,
            "justification_notes": justification_notes
        }
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), params)
            await session.commit()
            event = result.first()
        
        if event:
            return dict(event._mapping)
        return None
    
    async def delete_anomaly_event(self, event_id: str) -> bool:
        """刪除異常事件"""
        
        query = """
            DELETE FROM anomaly_event
            WHERE id = :event_id
            RETURNING id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"event_id": event_id})
            await session.commit()
            deleted = result.first()
        
        return deleted is not None
    
    async def get_anomaly_stats(self, organization_id: str) -> AnomalyStatsModel:
        """獲取異常事件統計資訊"""
        
        query = """
            SELECT 
                COUNT(*) as total_events,
                COUNT(CASE WHEN status = 'UNREVIEWED' THEN 1 END) as unreviewed_count,
                COUNT(CASE WHEN status = 'CONFIRMED_POSITIVE' THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN status = 'REJECTED_NORMAL' THEN 1 END) as rejected_count,
                COALESCE(AVG(score), 0) as avg_score,
                COALESCE(MAX(score), 0) as max_score,
                COUNT(DISTINCT meter_id) as unique_meters
            FROM anomaly_event
            WHERE organization_id = :organization_id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"organization_id": organization_id})
            stats = result.first()
        
        if stats:
            stats_dict = dict(stats._mapping)
            return AnomalyStatsModel(
                totalEvents=stats_dict['total_events'] or 0,
                unreviewedCount=stats_dict['unreviewed_count'] or 0,
                confirmedCount=stats_dict['confirmed_count'] or 0,
                rejectedCount=stats_dict['rejected_count'] or 0,
                avgScore=float(stats_dict['avg_score'] or 0),
                maxScore=float(stats_dict['max_score'] or 0),
                uniqueMeters=stats_dict['unique_meters'] or 0
            )
        
        return AnomalyStatsModel(
            totalEvents=0,
            unreviewedCount=0,
            confirmedCount=0,
            rejectedCount=0,
            avgScore=0.0,
            maxScore=0.0,
            uniqueMeters=0
        )
    
    async def get_anomaly_labels(self, organization_id: str) -> List[Dict[str, Any]]:
        """獲取組織的異常標籤列表"""
        
        query = """
            SELECT *
            FROM anomaly_label
            WHERE organization_id = :organization_id
            ORDER BY name
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"organization_id": organization_id})
            labels = [dict(row._mapping) for row in result]
        
        return labels
    
    async def create_anomaly_label(
        self,
        name: str,
        organization_id: str,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """創建新的異常標籤"""
        
        # 檢查名稱是否重複
        check_query = """
            SELECT id FROM anomaly_label
            WHERE organization_id = :organization_id AND name = :name
        """
        
        async with db_manager.get_session() as session:
            existing = await session.execute(text(check_query), {"organization_id": organization_id, "name": name})
            if existing.first():
                raise ValueError("Label name already exists")
            
            # 創建新標籤
            import uuid
            new_id = str(uuid.uuid4())
            
            create_query = """
                INSERT INTO anomaly_label (id, name, description, organization_id, created_at, updated_at)
                VALUES (:id, :name, :description, :organization_id, NOW(), NOW())
                RETURNING *
            """
            
            params = {
                "id": new_id,
                "name": name,
                "description": description,
                "organization_id": organization_id
            }
            
            result = await session.execute(text(create_query), params)
            await session.commit()
            label = result.first()
        
        return dict(label._mapping)
    
    async def update_anomaly_label(
        self,
        label_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """更新異常標籤"""
        
        # 構建動態更新查詢
        update_fields = []
        params = {"label_id": label_id}
        
        if name is not None:
            update_fields.append("name = :name")
            params["name"] = name
            
        if description is not None:
            update_fields.append("description = :description")
            params["description"] = description
        
        if not update_fields:
            raise ValueError("No fields to update")
        
        update_fields.append("updated_at = NOW()")
        
        query = f"""
            UPDATE anomaly_label
            SET {', '.join(update_fields)}
            WHERE id = :label_id
            RETURNING *
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), params)
            await session.commit()
            label = result.first()
        
        if label:
            return dict(label._mapping)
        return None
    
    async def delete_anomaly_label(self, label_id: str) -> bool:
        """刪除異常標籤"""
        
        query = """
            DELETE FROM anomaly_label
            WHERE id = :label_id
            RETURNING id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"label_id": label_id})
            await session.commit()
            deleted = result.first()
        
        return deleted is not None
    
    async def check_label_name_exists(
        self,
        organization_id: str,
        name: str,
        exclude_id: Optional[str] = None
    ) -> bool:
        """檢查標籤名稱是否已存在"""
        
        query = """
            SELECT id FROM anomaly_label
            WHERE organization_id = :organization_id AND name = :name
        """
        params = {"organization_id": organization_id, "name": name}
        
        if exclude_id:
            query += " AND id != :exclude_id"
            params["exclude_id"] = exclude_id
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), params)
            existing = result.first()
        
        return existing is not None

# 創建服務實例
anomaly_service = AnomalyService()
