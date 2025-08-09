"""
數據載入服務 - 管理原始數據的讀取和快取
從實際資料庫載入真實電表數據
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, date
import functools
import asyncio
import logging
from core.database import db_manager

logger = logging.getLogger(__name__)

class DataLoaderService:
    """數據載入服務 - 專門負責載入和快取真實數據"""
    
    def __init__(self):
        self._cached_data: Optional[pd.DataFrame] = None
        self._cache_timestamp: Optional[datetime] = None
        self._cache_expiry_hours = 1  # 快取1小時後重新載入
    
    @functools.lru_cache(maxsize=1)
    def _get_cached_raw_dataframe(self, cache_key: str) -> pd.DataFrame:
        """
        Use LRU cache to load real data from database only
        cache_key is used to force cache reload
        """
        logger.info("Loading real smart meter data from database...")
        try:
            # Load real data from database
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            df = loop.run_until_complete(self._load_real_data_async())
            loop.close()
            
            if df.empty:
                logger.warning("No real data found in database")
                return pd.DataFrame()
            
            return df
        except Exception as e:
            logger.error(f"Failed to load real data: {e}")
            return pd.DataFrame()
    
    async def _load_real_data_async(self) -> pd.DataFrame:
        """Load real smart meter data from database"""
        try:
            # Get recent smart meter logs from database (3 days instead of 7)
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=3)  # Use 3 days of data
            
            # Get data from the last 3 days
            logs = await db_manager.get_ammeter_logs(limit=50000)
            
            if not logs:
                logger.warning("No smart meter logs found in database")
                return pd.DataFrame()
            
            # Filter logs to last 3 days and convert to DataFrame
            data_rows = []
            for log in logs:
                # Only include successful logs with valid power data from last 3 days
                if (log.success and 
                    log.power is not None and 
                    log.power > 0 and
                    log.createdAt >= start_date):
                    
                    data_rows.append({
                        'deviceNumber': log.deviceNumber,
                        'timestamp': log.createdAt,
                        'power': float(log.power),
                        'voltage': float(log.voltage) if log.voltage else 220.0,
                        'current': float(log.currents) if log.currents else 0.0,
                        'battery': float(log.battery) if log.battery else 85.0,
                        'switchState': int(log.switchState) if log.switchState else 1,
                        'networkState': int(log.networkState) if log.networkState else 1
                    })
            
            if not data_rows:
                logger.warning("No valid smart meter data found in the last 3 days")
                return pd.DataFrame()
            
            df = pd.DataFrame(data_rows)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values(['deviceNumber', 'timestamp'])
            
            # Remove duplicates based on device and timestamp
            df = df.drop_duplicates(subset=['deviceNumber', 'timestamp'], keep='last')
            
            logger.info(f"Loaded {len(df)} real smart meter records from {df['deviceNumber'].nunique()} devices")
            logger.info(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to load real data from database: {e}")
            return pd.DataFrame()
        
    async def get_raw_dataframe(self, 
                              start_date: Optional[date] = None,
                              end_date: Optional[date] = None,
                              force_reload: bool = False) -> pd.DataFrame:
        """
        Get raw data DataFrame with optional date filtering
        Args:
            start_date: Start date for filtering (inclusive)
            end_date: End date for filtering (inclusive)
            force_reload: Whether to force reload data from cache
        """
        current_time = datetime.utcnow()
        
        # Check if cache needs to be reloaded
        if (force_reload or 
            self._cache_timestamp is None or 
            current_time - self._cache_timestamp > timedelta(hours=self._cache_expiry_hours)):
            
            # Use current timestamp as cache key to force reload
            cache_key = str(int(current_time.timestamp()))
            
            # Clear old cache
            self._get_cached_raw_dataframe.cache_clear()
            
            # Reload data
            df = self._get_cached_raw_dataframe(cache_key)
            self._cache_timestamp = current_time
        else:
            # Use existing cache
            cache_key = str(int(self._cache_timestamp.timestamp()))
            df = self._get_cached_raw_dataframe(cache_key)
        
        # Apply date filtering if specified
        if start_date or end_date:
            df = df.copy()  # Don't modify the cached data
            
            if start_date:
                start_datetime = datetime.combine(start_date, datetime.min.time())
                df = df[df['timestamp'] >= start_datetime]
            
            if end_date:
                end_datetime = datetime.combine(end_date, datetime.max.time())
                df = df[df['timestamp'] <= end_datetime]
            
            logger.info(f"Applied date filter: {start_date} to {end_date}, "
                       f"filtered to {len(df)} records")
        
        return df
    
    async def get_device_data(self, device_number: str, 
                            start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> pd.DataFrame:
        """
        獲取特定設備的數據
        Args:
            device_number: 設備編號
            start_date: 開始日期
            end_date: 結束日期
        """
        df = await self.get_raw_dataframe()
        
        # 篩選特定設備
        device_df = df[df['deviceNumber'] == device_number].copy()
        
        # 日期篩選
        if start_date:
            device_df = device_df[device_df['timestamp'] >= start_date]
        if end_date:
            device_df = device_df[device_df['timestamp'] <= end_date]
        
        return device_df.sort_values('timestamp')
    
    async def get_devices_list(self) -> List[Dict[str, Any]]:
        """獲取所有設備清單及基本統計"""
        df = await self.get_raw_dataframe()
        
        devices = []
        for device in df['deviceNumber'].unique():
            device_df = df[df['deviceNumber'] == device]
            
            devices.append({
                'deviceNumber': device,
                'recordCount': len(device_df),
                'avgPower': round(device_df['power'].mean(), 2),
                'maxPower': round(device_df['power'].max(), 2),
                'minPower': round(device_df['power'].min(), 2),
                'lastUpdate': device_df['timestamp'].max().isoformat(),
                'firstRecord': device_df['timestamp'].min().isoformat()
            })
        
        return sorted(devices, key=lambda x: x['deviceNumber'])
    
    async def get_data_summary(self) -> Dict[str, Any]:
        """獲取數據摘要統計"""
        df = await self.get_raw_dataframe()
        
        return {
            'totalRecords': len(df),
            'deviceCount': df['deviceNumber'].nunique(),
            'dateRange': {
                'start': df['timestamp'].min().isoformat(),
                'end': df['timestamp'].max().isoformat(),
                'days': (df['timestamp'].max() - df['timestamp'].min()).days
            },
            'powerStats': {
                'mean': round(df['power'].mean(), 2),
                'median': round(df['power'].median(), 2),
                'std': round(df['power'].std(), 2),
                'min': round(df['power'].min(), 2),
                'max': round(df['power'].max(), 2),
                'q25': round(df['power'].quantile(0.25), 2),
                'q75': round(df['power'].quantile(0.75), 2)
            },
            'dataQuality': {
                'completeness': round((1 - df['power'].isna().sum() / len(df)) * 100, 2),
                'duplicates': df.duplicated().sum(),
                'outliers': len(df[df['power'] > df['power'].quantile(0.99)])
            }
        }

# 創建服務實例
data_loader = DataLoaderService()
