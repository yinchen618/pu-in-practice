from fastapi import APIRouter, HTTPException, Request
from typing import List, Dict, Optional
from pydantic import BaseModel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.ammeter_service import ammeter_service

# 整合後的電表路由 - 提供向後相容性和統一的電表 API
ammeters_router = APIRouter(prefix="/api/ammeters", tags=["Smart Meter Management"])

# ========== 回應模型 ==========
class AmmeterListResponse(BaseModel):
    success: bool
    data: List[Dict]
    statistics: Dict
    message: Optional[str] = None

# ========== API 端點 ==========
@ammeters_router.get("/")
async def get_all_ammeters_detail_compat(request: Request):
    """批次獲取所有電表詳情 - 整合後的統一端點"""
    try:
        # 使用 ammeter_service 獲取所有電表數據
        all_ammeters = await ammeter_service.get_all_ammeters_detail()
        
        # 格式化為前端期望的格式
        formatted_results = []
        for ammeter in all_ammeters:
            result = {
                "factory": ammeter.factory,
                "device": ammeter.device,
                "voltage": ammeter.voltage,
                "currents": ammeter.currents,
                "power": ammeter.power,
                "battery": ammeter.battery,
                "switchState": ammeter.switchState,
                "networkState": ammeter.networkState,
                "deviceInfo": ammeter.deviceInfo
            }
            formatted_results.append(result)
        
        # 計算統計資料
        total_devices = len(formatted_results)
        online_devices = len([a for a in formatted_results if a.get("networkState") == 1])
        active_devices = len([a for a in formatted_results if a.get("switchState") == 1])
        total_power = sum(a.get("power", 0) for a in formatted_results)
        average_voltage = sum(a.get("voltage", 0) for a in formatted_results) / total_devices if total_devices > 0 else 0
        
        statistics = {
            "totalDevices": total_devices,
            "onlineDevices": online_devices,
            "activeDevices": active_devices,
            "totalPower": round(total_power, 1),
            "averageVoltage": round(average_voltage, 1)
        }
        
        return AmmeterListResponse(
            success=True,
            data=formatted_results,
            statistics=statistics,
            message=f"成功獲取 {len(formatted_results)} 個電表詳情"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批次獲取電表詳情失敗: {str(e)}")

@ammeters_router.get("/statistics")
async def get_ammeters_statistics_compat(request: Request):
    """獲取電表統計資料 - 整合後的統一端點"""
    try:
        # 使用 ammeter_service 獲取統計資料
        statistics = await ammeter_service.get_ammeters_statistics()
        
        return {
            "success": True,
            "data": {
                "totalDevices": statistics.totalDevices,
                "onlineDevices": statistics.onlineDevices,
                "activeDevices": statistics.activeDevices,
                "totalPower": statistics.totalPower,
                "averageVoltage": statistics.averageVoltage
            },
            "message": "成功獲取統計資料"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取統計資料失敗: {str(e)}") 
