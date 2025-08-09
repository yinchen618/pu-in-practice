import os
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, ForeignKey, JSON, Index
from sqlalchemy.future import select
import uuid

# PostgreSQL 連線字串
DATABASE_URL = os.getenv("DATABASE_URL") or "postgresql+asyncpg://postgres:Info4467@supa.clkvfvz5fxb3.ap-northeast-3.rds.amazonaws.com:5432/supa"

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

# ORM Model
class Ammeter(Base):
    __tablename__ = "ammeter"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    electricMeterNumber = Column(String, nullable=False)
    electricMeterName = Column(String, nullable=False)
    deviceNumber = Column(String, nullable=False, unique=True)
    factory = Column(String)
    device = Column(String)
    voltage = Column(Float)
    currents = Column(Float)
    power = Column(Float)
    battery = Column(Float)
    switchState = Column(Integer)
    networkState = Column(Integer)
    lastUpdated = Column(DateTime)
    organizationId = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AmmeterLog(Base):
    __tablename__ = "ammeter_log"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deviceNumber = Column(String, nullable=False)
    action = Column(String, nullable=False)
    factory = Column(String)
    device = Column(String)
    voltage = Column(Float)
    currents = Column(Float)
    power = Column(Float)
    battery = Column(Float)
    switchState = Column(Integer)
    networkState = Column(Integer)
    lastUpdated = Column(DateTime)
    requestData = Column(Text)
    responseData = Column(Text)
    statusCode = Column(Integer)
    success = Column(Boolean, nullable=False)
    errorMessage = Column(Text)
    responseTime = Column(Integer)
    ipAddress = Column(String)
    userAgent = Column(String)
    userId = Column(String)
    organizationId = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)

# 建表
async def init_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("PostgreSQL 資料表已建立")

# CRUD 範例
class DatabaseManager:
    def __init__(self):
        self.session_factory = async_session

    async def save_ammeter_data(self, ammeter_data: Dict[str, Any]) -> Optional[str]:
        async with self.session_factory() as session:
            # 依 deviceNumber 查找
            result = await session.execute(select(Ammeter).where(Ammeter.deviceNumber == ammeter_data["deviceNumber"]))
            ammeter = result.scalar_one_or_none()
            if ammeter:
                for k, v in ammeter_data.items():
                    if hasattr(ammeter, k):
                        setattr(ammeter, k, v)
                ammeter.updatedAt = datetime.utcnow()
            else:
                ammeter = Ammeter(**ammeter_data)
                session.add(ammeter)
            await session.commit()
            return ammeter.id

    async def get_ammeter_by_device_number(self, device_number: str) -> Optional[Ammeter]:
        async with self.session_factory() as session:
            result = await session.execute(select(Ammeter).where(Ammeter.deviceNumber == device_number))
            return result.scalar_one_or_none()

    async def get_ammeter_by_electric_meter_number(self, electric_meter_number: str) -> Optional[Ammeter]:
        async with self.session_factory() as session:
            result = await session.execute(select(Ammeter).where(Ammeter.electricMeterNumber == electric_meter_number))
            return result.scalar_one_or_none()

    async def get_all_ammeters(self) -> List[Ammeter]:
        async with self.session_factory() as session:
            result = await session.execute(select(Ammeter))
            return result.scalars().all()

    async def save_api_log(self, log_data: Dict[str, Any]) -> Optional[str]:
        async with self.session_factory() as session:
            # 如果是 ammeterDetail 動作且成功，嘗試解析電表資料
            if (log_data.get("action") == "ammeterDetail" and 
                log_data.get("success") and 
                log_data.get("responseData")):
                
                try:
                    import json
                    response_data = json.loads(log_data["responseData"])
                    
                    # 檢查是否有電表資料
                    if (response_data.get("result") == "1" and 
                        "data" in response_data):
                        
                        ammeter_data = response_data["data"]
                        
                        # 解析數值資料
                        def parse_voltage(voltage_str: str) -> float:
                            try:
                                if not voltage_str or len(voltage_str) < 4:
                                    return 0.0
                                value = int(voltage_str[-4:])
                                return value / 10.0
                            except:
                                return 0.0
                        
                        def parse_current(current_str: str) -> float:
                            try:
                                if not current_str or len(current_str) < 4:
                                    return 0.0
                                value = int(current_str[-4:])
                                return value / 10.0
                            except:
                                return 0.0
                        
                        def parse_power(power_str: str) -> float:
                            try:
                                if not power_str or len(power_str) < 4:
                                    return 0.0
                                value = int(power_str[-4:])
                                return value / 10.0
                            except:
                                return 0.0
                        
                        def parse_battery(battery_str: str) -> float:
                            try:
                                if not battery_str or len(battery_str) < 5:
                                    return 0.0
                                value = int(battery_str[-5:])
                                return value / 100.0
                            except:
                                return 0.0
                        
                        # 將解析後的資料加入 log_data
                        log_data.update({
                            "factory": ammeter_data.get("factory", ""),
                            "device": ammeter_data.get("device", ""),
                            "voltage": parse_voltage(ammeter_data.get("voltage", "0")),
                            "currents": parse_current(ammeter_data.get("currents", "0")),
                            "power": parse_power(ammeter_data.get("power", "0")),
                            "battery": parse_battery(ammeter_data.get("battery", "0")),
                            "switchState": int(ammeter_data.get("switchState", 0)),
                            "networkState": int(ammeter_data.get("networkState", 0)),
                            "lastUpdated": datetime.utcnow()
                        })
                        
                except Exception as e:
                    # 解析失敗不影響日誌記錄
                    print(f"解析電表資料失敗: {e}")
            
            log = AmmeterLog(**log_data)
            session.add(log)
            await session.commit()
            return log.id

    async def get_ammeter_logs(self, device_number: str = None, limit: int = 100) -> List[AmmeterLog]:
        async with self.session_factory() as session:
            stmt = select(AmmeterLog).order_by(AmmeterLog.createdAt.desc())
            if device_number:
                stmt = stmt.where(AmmeterLog.deviceNumber == device_number)
            if limit:
                stmt = stmt.limit(limit)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_ammeter_history(self, device_number: str, start_date: datetime = None, end_date: datetime = None, limit: int = 1000) -> List[AmmeterLog]:
        """獲取電表歷史資料，用於分析"""
        async with self.session_factory() as session:
            stmt = select(AmmeterLog).where(
                AmmeterLog.deviceNumber == device_number,
                AmmeterLog.action == "ammeterDetail",
                AmmeterLog.success == True
            ).order_by(AmmeterLog.createdAt.desc())
            
            if start_date:
                stmt = stmt.where(AmmeterLog.createdAt >= start_date)
            if end_date:
                stmt = stmt.where(AmmeterLog.createdAt <= end_date)
            if limit:
                stmt = stmt.limit(limit)
                
            result = await session.execute(stmt)
            return result.scalars().all()

    async def get_ammeter_statistics(self, device_number: str, days: int = 7) -> Dict:
        """獲取電表統計資料"""
        from datetime import timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        history = await self.get_ammeter_history(device_number, start_date, end_date)
        
        if not history:
            return {
                "deviceNumber": device_number,
                "period": f"{days}天",
                "totalRecords": 0,
                "averageVoltage": 0,
                "averageCurrent": 0,
                "averagePower": 0,
                "totalBattery": 0,
                "onlineRate": 0,
                "activeRate": 0
            }
        
        # 計算統計資料
        voltages = [h.voltage for h in history if h.voltage is not None]
        currents = [h.currents for h in history if h.currents is not None]
        powers = [h.power for h in history if h.power is not None]
        batteries = [h.battery for h in history if h.battery is not None]
        network_states = [h.networkState for h in history if h.networkState is not None]
        switch_states = [h.switchState for h in history if h.switchState is not None]
        
        return {
            "deviceNumber": device_number,
            "period": f"{days}天",
            "totalRecords": len(history),
            "averageVoltage": sum(voltages) / len(voltages) if voltages else 0,
            "averageCurrent": sum(currents) / len(currents) if currents else 0,
            "averagePower": sum(powers) / len(powers) if powers else 0,
            "totalBattery": max(batteries) - min(batteries) if len(batteries) > 1 else 0,
            "onlineRate": sum(1 for s in network_states if s == 1) / len(network_states) if network_states else 0,
            "activeRate": sum(1 for s in switch_states if s == 1) / len(switch_states) if switch_states else 0
        }

# 異常事件相關表
class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, nullable=False, unique=True)
    meter_id = Column(String, nullable=False)
    event_timestamp = Column(DateTime, nullable=False)
    detection_rule = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    data_window = Column(JSON)  # 存儲時間序列資料
    status = Column(String, nullable=False, default="UNREVIEWED")  # UNREVIEWED, CONFIRMED_POSITIVE, REJECTED_NORMAL
    reviewer_id = Column(String)
    review_timestamp = Column(DateTime)
    justification_notes = Column(Text)
    organization_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 為效能建立索引
    __table_args__ = (
        Index('idx_anomaly_event_meter_timestamp', 'meter_id', 'event_timestamp'),
        Index('idx_anomaly_event_status', 'status'),
        Index('idx_anomaly_event_org', 'organization_id'),
        Index('idx_anomaly_event_timestamp', 'event_timestamp'),
    )

class AnomalyLabel(Base):
    __tablename__ = "anomaly_labels"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String, default="#6B7280")  # 標籤顏色
    organization_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EventLabelLink(Base):
    __tablename__ = "event_label_links"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, ForeignKey('anomaly_events.id'), nullable=False)
    label_id = Column(String, ForeignKey('anomaly_labels.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 確保同一事件和標籤的組合唯一
    __table_args__ = (
        Index('idx_event_label_unique', 'event_id', 'label_id', unique=True),
    )

# 時間序列資料表（用於存儲詳細的感測器資料）
class TimeSeriesData(Base):
    __tablename__ = "timeseries_data"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    metric_name = Column(String, nullable=False)  # voltage, current, power, etc.
    value = Column(Float, nullable=False)
    unit = Column(String)  # V, A, W, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 為查詢效能建立關鍵索引
    __table_args__ = (
        Index('idx_timeseries_device_timestamp', 'device_id', 'timestamp'),
        Index('idx_timeseries_timestamp', 'timestamp'),
        Index('idx_timeseries_device_metric', 'device_id', 'metric_name'),
    )

db_manager = DatabaseManager() 
