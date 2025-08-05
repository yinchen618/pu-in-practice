"""
Ammeter Service - 電表數據服務
專門處理電表相關的數據獲取和管理
"""
import csv
import os
from typing import List, Dict, Optional
from pydantic import BaseModel
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from core.database import db_manager


# ========== 資料模型 ==========
class AmmeterDevice(BaseModel):
    electricMeterNumber: str
    electricMeterName: str
    deviceNumber: str


class AmmeterData(BaseModel):
    factory: str
    device: str
    voltage: float
    currents: float
    power: float
    battery: float
    switchState: int
    networkState: int
    deviceInfo: Dict[str, str]


class AmmeterStatistics(BaseModel):
    totalDevices: int
    onlineDevices: int
    activeDevices: int
    totalPower: float
    averageVoltage: float


# ========== 單例服務類 ==========
class AmmeterService:
    _instance = None
    _ammeter_devices: List[AmmeterDevice] = []
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AmmeterService, cls).__new__(cls)
            cls._instance._load_ammeter_devices()
        return cls._instance
    
    def _load_ammeter_devices(self):
        """從 CSV 檔案載入電表設備清單"""
        self._ammeter_devices = []
        csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "meter.csv")
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    self._ammeter_devices.append(AmmeterDevice(
                        electricMeterNumber=row["电表号"],
                        electricMeterName=row["电表名称"],
                        deviceNumber=row["设备编号"]
                    ))
        except Exception as e:
            print(f"載入電表設備清單失敗: {e}")
    
    @property
    def ammeter_devices(self) -> List[AmmeterDevice]:
        """獲取電表設備清單"""
        return self._ammeter_devices
    
    def get_device_info(self, device_number: str) -> Optional[AmmeterDevice]:
        """根據設備編號獲取設備資訊"""
        for device in self._ammeter_devices:
            if device.deviceNumber == device_number:
                return device
        return None
    
    def get_device_by_electric_meter_number(self, electric_meter_number: str) -> Optional[AmmeterDevice]:
        """根據電表號獲取設備資訊"""
        for device in self._ammeter_devices:
            if device.electricMeterNumber == electric_meter_number:
                return device
        return None
    
    def get_device_by_electric_meter_name(self, electric_meter_name: str) -> Optional[AmmeterDevice]:
        """根據電表名稱獲取設備資訊"""
        for device in self._ammeter_devices:
            if device.electricMeterName == electric_meter_name:
                return device
        return None
    
    def get_devices_by_building(self, building_name: str) -> List[AmmeterDevice]:
        """根據建築物名稱獲取所有設備資訊"""
        devices = []
        for device in self._ammeter_devices:
            if building_name in device.electricMeterName:
                devices.append(device)
        return devices
    
    async def get_all_ammeters_detail(self) -> List[AmmeterData]:
        """獲取所有電表詳情"""
        try:
            # 使用 testbed_service 獲取所有電表數據
            all_ammeters = await db_manager.get_all_ammeters()
            
            # 格式化為前端期望的格式
            formatted_results = []
            for ammeter in all_ammeters:
                # 獲取設備資訊
                device_info = self.get_device_by_electric_meter_number(ammeter.electricMeterNumber)
                
                result = AmmeterData(
                    factory=ammeter.factory or "",
                    device=ammeter.deviceNumber,
                    voltage=ammeter.voltage or 0,
                    currents=ammeter.currents or 0,
                    power=ammeter.power or 0,
                    battery=ammeter.battery or 0,
                    switchState=ammeter.switchState or 0,
                    networkState=ammeter.networkState or 0,
                    deviceInfo={
                        "electricMeterNumber": device_info.electricMeterNumber if device_info else ammeter.electricMeterNumber,
                        "electricMeterName": device_info.electricMeterName if device_info else f"電表 {ammeter.electricMeterNumber}",
                        "deviceNumber": ammeter.deviceNumber
                    } if device_info else {
                        "electricMeterNumber": ammeter.electricMeterNumber,
                        "electricMeterName": f"電表 {ammeter.electricMeterNumber}",
                        "deviceNumber": ammeter.deviceNumber
                    }
                )
                formatted_results.append(result)
            
            return formatted_results
        except Exception as e:
            raise Exception(f"獲取電表詳情失敗: {str(e)}")
    
    async def get_ammeters_statistics(self) -> AmmeterStatistics:
        """獲取電表統計資料"""
        try:
            all_ammeters = await self.get_all_ammeters_detail()
            
            total_devices = len(all_ammeters)
            online_devices = len([a for a in all_ammeters if a.networkState == 1])
            active_devices = len([a for a in all_ammeters if a.switchState == 1])
            total_power = sum(a.power for a in all_ammeters)
            average_voltage = sum(a.voltage for a in all_ammeters) / total_devices if total_devices > 0 else 0
            
            return AmmeterStatistics(
                totalDevices=total_devices,
                onlineDevices=online_devices,
                activeDevices=active_devices,
                totalPower=round(total_power, 1),
                averageVoltage=round(average_voltage, 1)
            )
        except Exception as e:
            raise Exception(f"獲取統計資料失敗: {str(e)}")


# ========== 創建單例實例 ==========
ammeter_service = AmmeterService() 
