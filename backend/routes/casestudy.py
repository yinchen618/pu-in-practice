from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime, date
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.anomaly_service import anomaly_service

router = APIRouter(prefix="/api/case-study", tags=["Case Study Anomaly Detection"])

# ========== Response Models ==========
class AnomalyEventResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

class AnomalyEventsListResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

class AnomalyLabelsResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]]
    message: Optional[str] = None

class AnomalyStatsResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

# ========== API Endpoints ==========
@router.get("/events", response_model=AnomalyEventsListResponse)
async def get_anomaly_events(
    organization_id: str = Query(..., description="Organization ID"),
    status: Optional[str] = Query(None, description="Event status filter"),
    meter_id: Optional[str] = Query(None, description="Meter ID filter"),
    search: Optional[str] = Query(None, description="Search term"),
    date_from: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    page: int = Query(1, description="Page number"),
    limit: int = Query(50, description="Items per page")
):
    """Get anomaly events list with filters and pagination"""
    try:
        result = await anomaly_service.get_anomaly_events(
            organization_id=organization_id,
            status=status,
            meter_id=meter_id,
            search=search,
            date_from=date_from,
            date_to=date_to,
            page=page,
            limit=limit
        )
        
        return AnomalyEventsListResponse(
            success=True,
            data=result.dict(),
            message=f"Successfully retrieved {len(result.events)} anomaly events"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve anomaly events: {str(e)}")

@router.get("/events/{event_id}", response_model=AnomalyEventResponse)
async def get_anomaly_event_detail(event_id: str):
    """Get detailed anomaly event including dataWindow"""
    try:
        event_data = await anomaly_service.get_anomaly_event_by_id(event_id)
        
        if not event_data:
            raise HTTPException(status_code=404, detail="Anomaly event not found")
        
        return AnomalyEventResponse(
            success=True,
            data=event_data,
            message="Successfully retrieved anomaly event details"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve anomaly event details: {str(e)}")

@router.post("/events", response_model=AnomalyEventResponse)
async def create_anomaly_event(
    event_id: str,
    meter_id: str,
    event_timestamp: str,  # ISO format string
    detection_rule: str,
    score: float,
    data_window: Dict[str, Any],
    organization_id: str
):
    """Create a new anomaly event"""
    try:
        # Convert timestamp string to datetime
        event_time = datetime.fromisoformat(event_timestamp.replace('Z', '+00:00'))
        
        query = """
            INSERT INTO anomaly_event 
            (id, event_id, meter_id, event_timestamp, detection_rule, score, data_window, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), :event_id, :meter_id, :event_timestamp, :detection_rule, :score, :data_window, :organization_id, NOW(), NOW())
            RETURNING *
        """
        
        params = {
            "event_id": event_id,
            "meter_id": meter_id,
            "event_timestamp": event_time,
            "detection_rule": detection_rule,
            "score": score,
            "data_window": data_window,
            "organization_id": organization_id
        }
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), params)
            await session.commit()
            event = result.first()
        
        event_data = dict(event._mapping)
        
        return AnomalyEventResponse(
            success=True,
            data=event_data,
            message="Successfully created anomaly event"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create anomaly event: {str(e)}")

@router.put("/events/{event_id}/review", response_model=AnomalyEventResponse)
async def review_anomaly_event(
    event_id: str,
    status: str,
    reviewer_id: str,
    justification_notes: Optional[str] = None,
    label_ids: Optional[List[str]] = None
):
    """Review an anomaly event"""
    try:
        # Update event status
        update_query = """
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
            result = await session.execute(text(update_query), params)
            await session.commit()
            event = result.first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Anomaly event not found")
        
        # Handle label associations if provided
        if label_ids:
            # This would require implementing event_label_link table operations
            pass
        
        event_data = dict(event._mapping)
        
        return AnomalyEventResponse(
            success=True,
            data=event_data,
            message="Successfully reviewed anomaly event"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to review anomaly event: {str(e)}")

@router.delete("/events/{event_id}")
async def delete_anomaly_event(event_id: str):
    """Delete an anomaly event"""
    try:
        query = """
            DELETE FROM anomaly_event
            WHERE id = :event_id
            RETURNING id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"event_id": event_id})
            await session.commit()
            deleted = result.first()
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Anomaly event not found")
        
        return {"success": True, "message": "Anomaly event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete anomaly event: {str(e)}")

@router.get("/stats", response_model=AnomalyStatsResponse)
async def get_anomaly_stats(organization_id: str = Query(..., description="Organization ID")):
    """Get anomaly events statistics"""
    try:
        query = """
            SELECT 
                COUNT(*) as total_events,
                COUNT(CASE WHEN status = 'UNREVIEWED' THEN 1 END) as unreviewed_count,
                COUNT(CASE WHEN status = 'CONFIRMED_POSITIVE' THEN 1 END) as confirmed_count,
                COUNT(CASE WHEN status = 'REJECTED_NORMAL' THEN 1 END) as rejected_count,
                AVG(score) as avg_score,
                MAX(score) as max_score,
                COUNT(DISTINCT meter_id) as unique_meters
            FROM anomaly_event
            WHERE organization_id = :organization_id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"organization_id": organization_id})
            stats = result.first()
        
        stats_data = dict(stats._mapping) if stats else {}
        
        return AnomalyStatsResponse(
            success=True,
            data=stats_data,
            message="Successfully retrieved anomaly statistics"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve anomaly statistics: {str(e)}")

@router.get("/labels", response_model=AnomalyLabelsResponse)
async def get_anomaly_labels(organization_id: str = Query(..., description="Organization ID")):
    """Get anomaly labels for organization"""
    try:
        query = """
            SELECT *
            FROM anomaly_label
            WHERE organization_id = :organization_id
            ORDER BY name
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"organization_id": organization_id})
            labels = [dict(row._mapping) for row in result]
        
        return AnomalyLabelsResponse(
            success=True,
            data=labels,
            message=f"Successfully retrieved {len(labels)} anomaly labels"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve anomaly labels: {str(e)}")

@router.post("/labels")
async def create_anomaly_label(
    name: str,
    description: Optional[str],
    organization_id: str
):
    """Create a new anomaly label"""
    try:
        # Check if label name already exists
        check_query = """
            SELECT id FROM anomaly_label
            WHERE organization_id = :organization_id AND name = :name
        """
        
        async with db_manager.get_session() as session:
            existing = await session.execute(text(check_query), {"organization_id": organization_id, "name": name})
            if existing.first():
                raise HTTPException(status_code=400, detail="Label name already exists")
            
            # Create new label
            create_query = """
                INSERT INTO anomaly_label (id, name, description, organization_id, created_at, updated_at)
                VALUES (gen_random_uuid(), :name, :description, :organization_id, NOW(), NOW())
                RETURNING *
            """
            
            params = {
                "name": name,
                "description": description,
                "organization_id": organization_id
            }
            
            result = await session.execute(text(create_query), params)
            await session.commit()
            label = result.first()
        
        label_data = dict(label._mapping)
        
        return {
            "success": True,
            "data": label_data,
            "message": "Successfully created anomaly label"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create anomaly label: {str(e)}")

@router.put("/labels/{label_id}")
async def update_anomaly_label(
    label_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None
):
    """Update an anomaly label"""
    try:
        # Build update query dynamically
        update_fields = []
        params = {"label_id": label_id}
        
        if name is not None:
            update_fields.append("name = :name")
            params["name"] = name
            
        if description is not None:
            update_fields.append("description = :description")
            params["description"] = description
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
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
        
        if not label:
            raise HTTPException(status_code=404, detail="Anomaly label not found")
        
        label_data = dict(label._mapping)
        
        return {
            "success": True,
            "data": label_data,
            "message": "Successfully updated anomaly label"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update anomaly label: {str(e)}")

@router.delete("/labels/{label_id}")
async def delete_anomaly_label(label_id: str):
    """Delete an anomaly label"""
    try:
        query = """
            DELETE FROM anomaly_label
            WHERE id = :label_id
            RETURNING id
        """
        
        async with db_manager.get_session() as session:
            result = await session.execute(text(query), {"label_id": label_id})
            await session.commit()
            deleted = result.first()
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Anomaly label not found")
        
        return {"success": True, "message": "Anomaly label deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete anomaly label: {str(e)}")
