from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.testbed_service import testbed_service
from services.ammeter_service import ammeter_service

router = APIRouter(prefix="/api/testbed", tags=["Smart Meter Research Testbed"])

# ========== Response Models ==========
class TestbedOverviewResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

class ResidentialUnitsResponse(BaseModel):
    success: bool
    data: List[Dict[str, Any]]
    message: Optional[str] = None

class SmartMeterDataResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None

# ========== API Endpoints ==========
@router.get("/overview", response_model=TestbedOverviewResponse)
async def get_testbed_overview():
    """Retrieve comprehensive testbed overview and system status metrics"""
    try:
        overview = await testbed_service.get_testbed_overview()
        return TestbedOverviewResponse(
            success=True,
            data=overview.dict(),
            message="Successfully retrieved smart meter testbed overview"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve testbed overview: {str(e)}")

@router.get("/units", response_model=ResidentialUnitsResponse)
async def get_residential_units(building: Optional[str] = Query(None, description="Building filter (15 or 85)")):
    """Retrieve list of residential units with smart meter installations"""
    try:
        units = await testbed_service.get_testbed_units(building)
        units_data = [unit.dict() for unit in units]
        
        return ResidentialUnitsResponse(
            success=True,
            data=units_data,
            message=f"Successfully retrieved {'Building ' + building if building else 'all'} residential unit data"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve residential units: {str(e)}")

@router.get("/meter-data", response_model=SmartMeterDataResponse)
async def get_smart_meter_data(
    unit_id: str = Query(..., description="Residential unit identifier"),
    meter_type: str = Query(..., description="Meter configuration (main, appliance, or both)"),
    start_date: str = Query(..., description="Analysis start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Analysis end date (YYYY-MM-DD)")
):
    """Retrieve smart meter data for research analysis (deprecated, use ammeter-history)"""
    try:
        # 嘗試將 unit_id 作為電表號碼直接使用
        # 如果失敗，則嘗試將其作為電表名稱查找
        try:
            # 首先嘗試直接使用 unit_id 作為電表號碼
            device_info = ammeter_service.get_device_by_electric_meter_number(unit_id)
            if device_info:
                electric_meter_number = unit_id
            else:
                # 如果找不到，嘗試將其作為電表名稱查找
                device_info = ammeter_service.get_device_by_electric_meter_name(unit_id)
                if device_info:
                    electric_meter_number = device_info.electricMeterNumber
                else:
                    raise Exception(f"找不到電表號碼或電表名稱 '{unit_id}' 對應的設備資訊")
        except Exception as e:
            raise HTTPException(status_code=404, detail=str(e))
        
        # 如果是 appliance 類型，需要加上 'a' 後綴
        if meter_type == "appliance":
            # 查找對應的 appliance 電表
            appliance_name = f"{unit_id}a"
            appliance_device = ammeter_service.get_device_by_electric_meter_name(appliance_name)
            if appliance_device:
                electric_meter_number = appliance_device.electricMeterNumber
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"找不到 appliance 電表 '{appliance_name}' 對應的設備資訊"
                )
        
        # Utilize unified service for data retrieval
        meter_data = await testbed_service.get_ammeter_history_data(
            electric_meter_number, start_date, end_date
        )
        
        # Maintain backward compatibility in response format
        response_data = {
            "unitId": unit_id,
            "meterType": meter_type,
            "analysisTimeframe": {
                "startDate": start_date,
                "endDate": end_date
            },
            **meter_data.dict()
        }
        
        return SmartMeterDataResponse(
            success=True,
            data=response_data,
            message="Successfully retrieved smart meter data for analysis"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve smart meter data: {str(e)}")

@router.get("/ammeter-history", response_model=SmartMeterDataResponse)
async def get_ammeter_historical_data(
    building: Optional[str] = Query(None, description="Building identifier (a for 15學舍, b for 85學舍)"),
    meter_number: Optional[str] = Query(None, description="Meter number (e.g., 102)"),
    electric_meter_number: Optional[str] = Query(None, description="Full electric meter number"),
    start_date: str = Query(..., description="Analysis start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Analysis end date (YYYY-MM-DD)")
):
    """Retrieve historical smart meter data for energy consumption analysis"""
    try:
        # 處理不同的參數格式
        if electric_meter_number:
            # 直接使用完整的電表號碼
            target_meter_number = electric_meter_number
        elif building and meter_number:
            # 根據 building 和 meter_number 構建電表名稱
            building_prefix = "15學舍" if building == "a" else "85學舍"
            meter_name = f"{building_prefix}{meter_number}"
            
            # 根據電表名稱查找對應的電表號碼
            device_info = ammeter_service.get_device_by_electric_meter_name(meter_name)
            if not device_info:
                raise HTTPException(
                    status_code=404, 
                    detail=f"找不到電表名稱 '{meter_name}' 對應的設備資訊"
                )
            target_meter_number = device_info.electricMeterNumber
        else:
            raise HTTPException(
                status_code=422, 
                detail="Either 'electric_meter_number' or both 'building' and 'meter_number' must be provided"
            )
        
        # 記錄除錯資訊
        print(f"[DEBUG] API Request:")
        print(f"  Building: {building}")
        print(f"  Meter Number: {meter_number}")
        print(f"  Electric Meter Number: {electric_meter_number}")
        print(f"  Target Meter Number: {target_meter_number}")
        print(f"  Start Date: {start_date}")
        print(f"  End Date: {end_date}")
        
        meter_data = await testbed_service.get_ammeter_history_data(
            target_meter_number, start_date, end_date
        )
        
        return SmartMeterDataResponse(
            success=True,
            data=meter_data.dict(),
            message=f"Successfully retrieved historical data for smart meter {target_meter_number}"
        )
    except Exception as e:
        print(f"[ERROR] API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve smart meter historical data: {str(e)}")


