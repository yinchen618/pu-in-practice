"""
異常規則服務 - 純粹的規則引擎
實現各種異常檢測規則，如 Z-score、時段分析、持續時間檢測等
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import logging
from scipy import stats
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

class AnomalyRulesService:
    """異常規則服務 - 不依賴任何特定數據源的純函數規則引擎"""
    
    def __init__(self):
        self.default_params = {
            'zscore_threshold': 3.0,
            'time_window_hours': 24,
            'min_duration_minutes': 30,
            'power_threshold_multiplier': 2.0,
            'night_hour_start': 23,
            'night_hour_end': 6,
            'weekend_factor': 1.5,
            'moving_average_window': 12,  # 小時
        }
    
    async def calculate_candidate_count_enhanced(self, df: pd.DataFrame, params: Dict[str, Any]) -> int:
        """
        Enhanced candidate count calculation with new multi-dimensional rules
        Returns estimated count without actually generating events (for performance)
        """
        if df.empty:
            return 0
        
        # Merge parameters with defaults
        detection_params = {**self.default_params, **params}
        
        logger.info(f"Enhanced candidate count calculation with params: {detection_params}")
        
        total_candidates = 0
        
        # Process each device separately
        for device in df['deviceNumber'].unique():
            device_df = df[df['deviceNumber'] == device].sort_values('timestamp')
            
            if len(device_df) < detection_params.get('min_data_points', 48):
                continue
            
            device_candidates = 0
            
            # A. Value-based rules
            device_candidates += self._estimate_zscore_anomalies(device_df, detection_params)
            device_candidates += self._estimate_spike_anomalies(device_df, detection_params)
            
            # B. Time-based rules
            device_candidates += self._estimate_time_anomalies(device_df, detection_params)
            
            # C. Data integrity rules
            device_candidates += self._estimate_gap_anomalies(device_df, detection_params)
            
            # D. Peer comparison rules (simplified estimation)
            device_candidates += self._estimate_peer_anomalies(device_df, detection_params)
            
            # Apply overlap reduction factor (avoid double counting)
            device_candidates = int(device_candidates * 0.7)  # Assume 30% overlap
            
            total_candidates += device_candidates
            
        logger.info(f"Estimated total candidates: {total_candidates}")
        return total_candidates

    async def calculate_candidate_stats_enhanced(self, df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced statistics for candidate calculation, including per-rule contributions
        and device-level summaries. Returns a dict with breakdown details.
        """
        if df.empty:
            return {
                'total_records': 0,
                'unique_devices': 0,
                'insufficient_data_devices': 0,
                'per_rule': {
                    'zscore_estimate': 0,
                    'spike_estimate': 0,
                    'time_estimate': 0,
                    'gap_estimate': 0,
                    'peer_estimate': 0,
                },
                'total_estimated_before_overlap': 0,
                'overlap_reduction_factor': 0.7,
                'overlap_adjusted_total': 0,
                'top_devices_by_estimated_anomalies': [],
            }

        detection_params = {**self.default_params, **params}

        per_rule_totals = {
            'zscore_estimate': 0,
            'spike_estimate': 0,
            'time_estimate': 0,
            'gap_estimate': 0,
            'peer_estimate': 0,
        }

        device_estimates: List[Dict[str, Any]] = []
        insufficient_devices = 0

        # Ensure required columns
        required_columns = ['timestamp', 'power', 'deviceNumber']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"缺少必要欄位: {missing_columns}")

        # Ensure timestamp is datetime
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df = df.copy()
            df['timestamp'] = pd.to_datetime(df['timestamp'])

        # Build records by date histogram
        try:
            date_counts_series = df['timestamp'].dt.date.value_counts().sort_index()
            records_by_date = [
                {'date': d.isoformat(), 'count': int(c)} for d, c in date_counts_series.items()
            ]
        except Exception:
            records_by_date = []

        for device in df['deviceNumber'].unique():
            device_df = df[df['deviceNumber'] == device].sort_values('timestamp')
            if len(device_df) < detection_params.get('min_data_points', 48):
                insufficient_devices += 1
                continue

            z_est = self._estimate_zscore_anomalies(device_df, detection_params)
            sp_est = self._estimate_spike_anomalies(device_df, detection_params)
            tm_est = self._estimate_time_anomalies(device_df, detection_params)
            gp_est = self._estimate_gap_anomalies(device_df, detection_params)
            pr_est = self._estimate_peer_anomalies(device_df, detection_params)

            per_rule_totals['zscore_estimate'] += z_est
            per_rule_totals['spike_estimate'] += sp_est
            per_rule_totals['time_estimate'] += tm_est
            per_rule_totals['gap_estimate'] += gp_est
            per_rule_totals['peer_estimate'] += pr_est

            device_estimates.append({
                'deviceNumber': device,
                'estimated_anomalies': int(z_est + sp_est + tm_est + gp_est + pr_est)
            })

        total_before_overlap = int(sum(v for v in per_rule_totals.values()))
        overlap_factor = 0.7
        overlap_adjusted_total = int(total_before_overlap * overlap_factor)

        # Build top devices list
        top_devices = sorted(device_estimates, key=lambda x: x['estimated_anomalies'], reverse=True)[:5]

        # Per-device records distribution
        per_device_counts = df.groupby('deviceNumber').size()
        device_records_summary = {
            'avg_records_per_device': float(per_device_counts.mean()) if len(per_device_counts) else 0.0,
            'median_records_per_device': float(per_device_counts.median()) if len(per_device_counts) else 0.0,
            'min_records_per_device': int(per_device_counts.min()) if len(per_device_counts) else 0,
            'max_records_per_device': int(per_device_counts.max()) if len(per_device_counts) else 0,
        }

        return {
            'total_records': int(len(df)),
            'unique_devices': int(df['deviceNumber'].nunique()),
            'insufficient_data_devices': int(insufficient_devices),
            'per_rule': {k: int(v) for k, v in per_rule_totals.items()},
            'total_estimated_before_overlap': total_before_overlap,
            'overlap_reduction_factor': overlap_factor,
            'overlap_adjusted_total': overlap_adjusted_total,
            'top_devices_by_estimated_anomalies': top_devices,
            'device_records_summary': device_records_summary,
            'time_range': {
                'start': df['timestamp'].min().isoformat(),
                'end': df['timestamp'].max().isoformat(),
            },
            'records_by_date': records_by_date,
        }

    def get_candidate_events(self, df: pd.DataFrame, params: Dict[str, Any]) -> pd.DataFrame:
        """
        主要的候選事件檢測函數
        Args:
            df: 包含 ['timestamp', 'power', 'deviceNumber'] 的 DataFrame
            params: 檢測參數字典
        Returns:
            候選異常事件的 DataFrame
        """
        if df.empty:
            return pd.DataFrame()
        
        # 合併參數
        detection_params = {**self.default_params, **params}
        
        logger.info(f"開始異常檢測，使用參數: {detection_params}")
        
        # 確保必要的欄位存在
        required_columns = ['timestamp', 'power', 'deviceNumber']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"缺少必要欄位: {missing_columns}")
        
        # 確保時間欄位是 datetime 類型
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df = df.copy()
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        candidate_events = []
        
        # 對每個設備分別進行檢測
        for device in df['deviceNumber'].unique():
            device_df = df[df['deviceNumber'] == device].sort_values('timestamp')
            
            if len(device_df) < detection_params.get('min_data_points', 48):  # 至少需要48個數據點
                logger.warning(f"設備 {device} 數據點不足，跳過檢測")
                continue
                
            logger.info(f"處理設備 {device}，共 {len(device_df)} 個數據點")
            
            # 1. Z-Score 異常檢測
            zscore_events = self._detect_zscore_anomalies(device_df, detection_params)
            candidate_events.extend(zscore_events)
            
            # 2. 功率突變檢測
            spike_events = self._detect_power_spikes(device_df, detection_params)
            candidate_events.extend(spike_events)
            
            # 3. 時段異常檢測
            if detection_params.get('detect_holiday_pattern', True):
                # 舊名稱 _detect_time_anomalies 已改為 _detect_time_based_anomalies；
                # 為相容性呼叫新的實作
                time_events = self._detect_time_based_anomalies(device_df, detection_params)
                candidate_events.extend(time_events)
            
            # 4. 數據間隙檢測
            gap_events = self._detect_data_gaps(device_df, detection_params)
            candidate_events.extend(gap_events)
        
        # 轉換為 DataFrame
        if not candidate_events:
            logger.info("未檢測到異常事件")
            return pd.DataFrame()
        
        events_df = pd.DataFrame(candidate_events)
        
        # 去重和後處理
        events_df = self._deduplicate_events(events_df)
        
        logger.info(f"檢測完成，共發現 {len(events_df)} 個候選異常事件")
        
        return events_df
    
    def _estimate_zscore_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate Z-score anomalies count"""
        try:
            threshold = params.get('z_score_threshold', 3.0)
            window = params.get('moving_average_window', 12)
            
            if len(device_df) < window * 2:
                return 0
            
            # Quick estimation without full calculation
            power_std = device_df['power'].std()
            power_mean = device_df['power'].mean()
            
            # Estimate anomalies based on standard normal distribution
            anomaly_ratio = 1 - 0.9973  # Approximately for Z > 3
            if threshold != 3.0:
                # Rough adjustment for different thresholds
                anomaly_ratio = max(0.001, 0.05 * (4 - threshold))
            
            return int(len(device_df) * anomaly_ratio)
            
        except Exception as e:
            logger.warning(f"Z-score estimation failed: {e}")
            return 0
    
    def _estimate_spike_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate power spike anomalies count"""
        try:
            spike_threshold = params.get('spike_percentage', 200.0) / 100.0
            baseline = device_df['power'].median()
            
            spikes = device_df[device_df['power'] > baseline * spike_threshold]
            return len(spikes)
            
        except Exception as e:
            logger.warning(f"Spike estimation failed: {e}")
            return 0
    
    def _estimate_time_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate time-based anomalies count"""
        try:
            if not params.get('detect_holiday_pattern', True):
                return 0
            
            device_df = device_df.copy()
            device_df['hour'] = device_df['timestamp'].dt.hour
            device_df['is_weekend'] = device_df['timestamp'].dt.weekday >= 5
            
            # Night hours (23:00 - 06:00) with high power
            night_hours = (device_df['hour'] >= 23) | (device_df['hour'] <= 6)
            power_threshold = device_df['power'].quantile(0.75)
            
            night_anomalies = device_df[night_hours & (device_df['power'] > power_threshold)]
            
            # Weekend anomalies (business-pattern usage on weekends)
            weekend_anomalies = device_df[device_df['is_weekend'] & (device_df['power'] > power_threshold)]
            
            return len(night_anomalies) + len(weekend_anomalies)
            
        except Exception as e:
            logger.warning(f"Time anomaly estimation failed: {e}")
            return 0
    
    def _estimate_gap_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate data integrity gap anomalies count"""
        try:
            max_gap_minutes = params.get('max_time_gap_minutes', 60)
            
            device_df = device_df.sort_values('timestamp')
            time_diffs = device_df['timestamp'].diff()
            
            # Convert to minutes
            time_diffs_minutes = time_diffs.dt.total_seconds() / 60
            
            # Count gaps exceeding threshold
            gap_anomalies = time_diffs_minutes > max_gap_minutes
            return gap_anomalies.sum()
            
        except Exception as e:
            logger.warning(f"Gap anomaly estimation failed: {e}")
            return 0
    
    def _estimate_peer_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate peer comparison anomalies count (simplified)"""
        try:
            exceed_percentage = params.get('peer_exceed_percentage', 150.0) / 100.0
            
            # For estimation, use device's own median as "peer average"
            # In real implementation, this would use actual peer data
            peer_baseline = device_df['power'].median()
            
            peer_anomalies = device_df[device_df['power'] > peer_baseline * exceed_percentage]
            return len(peer_anomalies)
            
        except Exception as e:
            logger.warning(f"Peer anomaly estimation failed: {e}")
            return 0
        """
        主要的候選事件檢測函數
        Args:
            df: 包含 ['timestamp', 'power', 'deviceNumber'] 的 DataFrame
            params: 檢測參數字典
        Returns:
            候選異常事件的 DataFrame
        """
        # 合併參數
        detection_params = {**self.default_params, **params}
        
        logger.info(f"開始異常檢測，使用參數: {detection_params}")
        
        # 確保必要的欄位存在
        required_columns = ['timestamp', 'power', 'deviceNumber']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"缺少必要欄位: {missing_columns}")
        
        # 確保時間欄位是 datetime 類型
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df = df.copy()
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        candidate_events = []
        
        # 對每個設備分別進行檢測
        for device in df['deviceNumber'].unique():
            device_df = df[df['deviceNumber'] == device].sort_values('timestamp')
            
            if len(device_df) < detection_params.get('min_data_points', 48):  # 至少需要48個數據點
                logger.warning(f"設備 {device} 數據點不足，跳過檢測")
                continue
            
            logger.info(f"檢測設備 {device}，數據點: {len(device_df)}")
            
            # 應用各種檢測規則
            device_events = []
            
            # 1. Z-score 異常檢測
            zscore_events = self._detect_zscore_anomalies(device_df, detection_params)
            device_events.extend(zscore_events)
            
            # 2. 時段異常檢測（夜間高用電）
            time_events = self._detect_time_based_anomalies(device_df, detection_params)
            device_events.extend(time_events)
            
            # 3. 持續時間異常檢測
            duration_events = self._detect_duration_anomalies(device_df, detection_params)
            device_events.extend(duration_events)
            
            # 4. 突變檢測
            spike_events = self._detect_power_spikes(device_df, detection_params)
            device_events.extend(spike_events)
            
            # 合併同一設備的事件
            candidate_events.extend(device_events)
            
            logger.info(f"設備 {device} 檢測到 {len(device_events)} 個候選事件")
        
        # 轉換為 DataFrame
        if candidate_events:
            events_df = pd.DataFrame(candidate_events)
            # 去除重複事件（時間和設備相同）
            events_df = self._deduplicate_events(events_df)
            logger.info(f"總共檢測到 {len(events_df)} 個唯一候選事件")
            return events_df
        else:
            logger.info("未檢測到任何候選事件")
            return pd.DataFrame()
    
    def _detect_zscore_anomalies(self, device_df: pd.DataFrame, params: Dict) -> List[Dict]:
        """Z-score 異常檢測"""
        events = []
        threshold = params.get('zscore_threshold', 3.0)
        
        try:
            # 計算移動平均和標準差
            window = params.get('moving_average_window', 12)
            device_df = device_df.copy()
            device_df['power_ma'] = device_df['power'].rolling(window=window, center=True).mean()
            device_df['power_std'] = device_df['power'].rolling(window=window, center=True).std()
            
            # 計算 Z-score
            device_df['zscore'] = np.abs((device_df['power'] - device_df['power_ma']) / device_df['power_std'])
            
            # 找出異常點
            anomalies = device_df[device_df['zscore'] > threshold].dropna()
            
            for _, row in anomalies.iterrows():
                events.append({
                    'deviceNumber': row['deviceNumber'],
                    'timestamp': row['timestamp'],
                    'power': row['power'],
                    'detection_rule': 'Z-Score',
                    'score': float(row['zscore']),
                    'threshold': threshold,
                    'baseline': float(row['power_ma']) if not pd.isna(row['power_ma']) else None,
                    'deviation': float(row['power'] - row['power_ma']) if not pd.isna(row['power_ma']) else None
                })
                
        except Exception as e:
            logger.error(f"Z-score 檢測失敗: {e}")
        
        return events
    
    def _detect_time_based_anomalies(self, device_df: pd.DataFrame, params: Dict) -> List[Dict]:
        """時段異常檢測（如夜間高用電）"""
        events = []
        
        try:
            night_start = params.get('night_hour_start', 23)
            night_end = params.get('night_hour_end', 6)
            threshold_multiplier = params.get('power_threshold_multiplier', 2.0)
            
            device_df = device_df.copy()
            device_df['hour'] = device_df['timestamp'].dt.hour
            device_df['is_weekend'] = device_df['timestamp'].dt.weekday >= 5
            
            # 計算白天平均用電
            day_mask = ~((device_df['hour'] >= night_start) | (device_df['hour'] <= night_end))
            day_power_mean = device_df[day_mask]['power'].mean()
            day_power_std = device_df[day_mask]['power'].std()
            
            if pd.isna(day_power_mean) or day_power_mean == 0:
                return events
            
            # 找出夜間高用電
            night_mask = (device_df['hour'] >= night_start) | (device_df['hour'] <= night_end)
            night_high_power = device_df[night_mask & (device_df['power'] > day_power_mean * threshold_multiplier)]
            
            for _, row in night_high_power.iterrows():
                score = row['power'] / day_power_mean
                events.append({
                    'deviceNumber': row['deviceNumber'],
                    'timestamp': row['timestamp'],
                    'power': row['power'],
                    'detection_rule': 'Night High Usage',
                    'score': float(score),
                    'threshold': threshold_multiplier,
                    'baseline': float(day_power_mean),
                    'time_period': 'night'
                })
                
        except Exception as e:
            logger.error(f"時段檢測失敗: {e}")
        
        return events
    
    def _detect_duration_anomalies(self, device_df: pd.DataFrame, params: Dict) -> List[Dict]:
        """持續時間異常檢測"""
        events = []
        min_duration = params.get('min_duration_minutes', 30)
        threshold_multiplier = params.get('power_threshold_multiplier', 2.0)
        
        try:
            device_df = device_df.copy()
            power_mean = device_df['power'].mean()
            power_threshold = power_mean * threshold_multiplier
            
            # 找出高功率時段
            high_power_mask = device_df['power'] > power_threshold
            device_df['high_power_group'] = (high_power_mask != high_power_mask.shift()).cumsum()
            
            # 分析每個高功率時段的持續時間
            for group_id in device_df[high_power_mask]['high_power_group'].unique():
                group_data = device_df[device_df['high_power_group'] == group_id]
                
                if len(group_data) == 0:
                    continue
                
                # 計算持續時間（假設數據間隔為1小時）
                duration_hours = len(group_data)
                duration_minutes = duration_hours * 60  # 假設每小時一筆數據
                
                if duration_minutes >= min_duration:
                    # 取時段中間點作為事件時間
                    event_time = group_data['timestamp'].iloc[len(group_data)//2]
                    avg_power = group_data['power'].mean()
                    max_power = group_data['power'].max()
                    
                    events.append({
                        'deviceNumber': group_data['deviceNumber'].iloc[0],
                        'timestamp': event_time,
                        'power': float(max_power),
                        'detection_rule': 'Sustained High Usage',
                        'score': float(avg_power / power_mean),
                        'duration_minutes': duration_minutes,
                        'baseline': float(power_mean),
                        'avg_power_during_event': float(avg_power)
                    })
                    
        except Exception as e:
            logger.error(f"持續時間檢測失敗: {e}")
        
        return events
    
    def _detect_power_spikes(self, device_df: pd.DataFrame, params: Dict) -> List[Dict]:
        """突然功率變化檢測"""
        events = []
        
        try:
            device_df = device_df.copy()
            # 計算功率變化率
            device_df['power_diff'] = device_df['power'].diff()
            device_df['power_pct_change'] = device_df['power'].pct_change()
            
            # 設定閾值
            diff_threshold = device_df['power_diff'].std() * 3
            # 使用參數中的 spike_percentage（百分比），預設 200% = 2.0
            pct_threshold = (params.get('spike_percentage', 200.0) or 200.0) / 100.0
            
            # 找出突變點
            spike_mask = (
                (np.abs(device_df['power_diff']) > diff_threshold) |
                (np.abs(device_df['power_pct_change']) > pct_threshold)
            )
            
            spikes = device_df[spike_mask].dropna()
            
            for _, row in spikes.iterrows():
                events.append({
                    'deviceNumber': row['deviceNumber'],
                    'timestamp': row['timestamp'],
                    'power': row['power'],
                    'detection_rule': 'Power Spike',
                    'score': float(np.abs(row['power_pct_change'])) if not pd.isna(row['power_pct_change']) else 0,
                    'power_change': float(row['power_diff']) if not pd.isna(row['power_diff']) else 0,
                    'percent_change': float(row['power_pct_change']) if not pd.isna(row['power_pct_change']) else 0
                })
                
        except Exception as e:
            logger.error(f"突變檢測失敗: {e}")
        
        return events

    def _detect_data_gaps(self, device_df: pd.DataFrame, params: Dict) -> List[Dict]:
        """資料間隙檢測：找出時間間隔超過閾值的缺口事件"""
        events: List[Dict] = []
        try:
            max_gap_minutes = params.get('max_time_gap_minutes', 60)
            if 'timestamp' not in device_df.columns:
                return events
            df = device_df.sort_values('timestamp').copy()
            if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
                df['timestamp'] = pd.to_datetime(df['timestamp'])

            # 前後相鄰時間差（分鐘）
            df['__time_diff_min'] = df['timestamp'].diff().dt.total_seconds() / 60.0
            gap_mask = df['__time_diff_min'] > max_gap_minutes
            gaps = df[gap_mask]

            for idx, row in gaps.iterrows():
                current_time = row['timestamp']
                prev_time = df.loc[idx - 1, 'timestamp'] if (idx - 1) in df.index else None
                gap_minutes = float(row['__time_diff_min']) if not pd.isna(row['__time_diff_min']) else None

                events.append({
                    'deviceNumber': row['deviceNumber'],
                    'timestamp': current_time,
                    'detection_rule': 'Data Gap',
                    'score': gap_minutes or 0.0,
                    'gap_minutes': gap_minutes,
                    'gap_start': prev_time,
                    'gap_end': current_time,
                    'threshold_minutes': max_gap_minutes,
                })

            # 清理臨時欄位
            if '__time_diff_min' in df.columns:
                df.drop(columns=['__time_diff_min'], inplace=True)
        except Exception as e:
            logger.error(f"資料間隙檢測失敗: {e}")
        return events

    # 相容性別名：舊程式呼叫 _detect_time_anomalies，實際實作為 _detect_time_based_anomalies
    def _detect_time_anomalies(self, device_df: pd.DataFrame, params: Dict) -> List[Dict]:
        return self._detect_time_based_anomalies(device_df, params)
    
    def _deduplicate_events(self, events_df: pd.DataFrame) -> pd.DataFrame:
        """去除重複事件"""
        if events_df.empty:
            return events_df
        
        # 按設備和時間排序
        events_df = events_df.sort_values(['deviceNumber', 'timestamp'])
        
        # 合併時間相近的事件（1小時內）
        dedup_events = []
        
        for device in events_df['deviceNumber'].unique():
            device_events = events_df[events_df['deviceNumber'] == device]
            
            if len(device_events) == 0:
                continue
            
            last_event = None
            
            for _, event in device_events.iterrows():
                # 如果是第一個事件，或者與上一個事件時間間隔超過1小時
                if (last_event is None or 
                    (event['timestamp'] - last_event['timestamp']).total_seconds() > 3600):
                    dedup_events.append(event.to_dict())
                    last_event = event
                else:
                    # 合併事件：保留分數更高的
                    if event['score'] > last_event['score']:
                        dedup_events[-1] = event.to_dict()
                        last_event = event
        
        return pd.DataFrame(dedup_events) if dedup_events else pd.DataFrame()
    
    def calculate_candidate_count(self, df: pd.DataFrame, params: Dict[str, Any]) -> int:
        """
        計算候選事件數量（不生成完整事件，用於快速預估）
        """
        try:
            detection_params = {**self.default_params, **params}
            
            # 快速估算
            total_count = 0
            
            for device in df['deviceNumber'].unique():
                device_df = df[df['deviceNumber'] == device]
                
                if len(device_df) < 48:  # 最少數據要求
                    continue
                
                # 簡化的異常檢測計算
                power_mean = device_df['power'].mean()
                power_std = device_df['power'].std()
                
                if power_std == 0:
                    continue
                
                # Z-score 異常估算
                zscore_threshold = detection_params.get('zscore_threshold', 3.0)
                zscore_count = len(device_df[np.abs((device_df['power'] - power_mean) / power_std) > zscore_threshold])
                
                # 夜間異常估算
                device_df_copy = device_df.copy()
                device_df_copy['hour'] = pd.to_datetime(device_df_copy['timestamp']).dt.hour
                night_start = detection_params.get('night_hour_start', 23)
                night_end = detection_params.get('night_hour_end', 6)
                night_mask = (device_df_copy['hour'] >= night_start) | (device_df_copy['hour'] <= night_end)
                threshold_multiplier = detection_params.get('power_threshold_multiplier', 2.0)
                night_count = len(device_df_copy[night_mask & (device_df_copy['power'] > power_mean * threshold_multiplier)])
                
                total_count += zscore_count + night_count
            
            # 考慮去重複，大約減少30%
            return int(total_count * 0.7)
            
        except Exception as e:
            logger.error(f"候選事件計算失敗: {e}")
            return 0

    def _estimate_zscore_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate Z-score anomalies count"""
        try:
            threshold = params.get('z_score_threshold', 3.0)
            window = params.get('moving_average_window', 12)
            
            if len(device_df) < window * 2:
                return 0
            
            # Quick estimation without full calculation
            power_std = device_df['power'].std()
            power_mean = device_df['power'].mean()
            
            if power_std == 0:
                return 0
            
            # Estimate anomalies based on standard normal distribution
            anomaly_ratio = 1 - 0.9973  # Approximately for Z > 3
            if threshold != 3.0:
                # Rough adjustment for different thresholds
                anomaly_ratio = max(0.001, 0.05 * (4 - threshold))
            
            return int(len(device_df) * anomaly_ratio)
            
        except Exception as e:
            logger.warning(f"Z-score estimation failed: {e}")
            return 0
    
    def _estimate_spike_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate power spike anomalies count"""
        try:
            spike_threshold = params.get('spike_percentage', 200.0) / 100.0
            baseline = device_df['power'].median()
            
            spikes = device_df[device_df['power'] > baseline * spike_threshold]
            return len(spikes)
            
        except Exception as e:
            logger.warning(f"Spike estimation failed: {e}")
            return 0
    
    def _estimate_time_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate time-based anomalies count"""
        try:
            if not params.get('detect_holiday_pattern', True):
                return 0
            
            device_df = device_df.copy()
            device_df['hour'] = device_df['timestamp'].dt.hour
            device_df['is_weekend'] = device_df['timestamp'].dt.weekday >= 5
            
            # Night hours (23:00 - 06:00) with high power
            night_hours = (device_df['hour'] >= 23) | (device_df['hour'] <= 6)
            power_threshold = device_df['power'].quantile(0.75)
            
            night_anomalies = device_df[night_hours & (device_df['power'] > power_threshold)]
            
            # Weekend anomalies (business-pattern usage on weekends)
            weekend_anomalies = device_df[device_df['is_weekend'] & (device_df['power'] > power_threshold)]
            
            return len(night_anomalies) + len(weekend_anomalies)
            
        except Exception as e:
            logger.warning(f"Time anomaly estimation failed: {e}")
            return 0
    
    def _estimate_gap_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate data integrity gap anomalies count"""
        try:
            max_gap_minutes = params.get('max_time_gap_minutes', 60)
            
            device_df = device_df.sort_values('timestamp')
            time_diffs = device_df['timestamp'].diff()
            
            # Convert to minutes
            time_diffs_minutes = time_diffs.dt.total_seconds() / 60
            
            # Count gaps exceeding threshold
            gap_anomalies = time_diffs_minutes > max_gap_minutes
            return gap_anomalies.sum()
            
        except Exception as e:
            logger.warning(f"Gap anomaly estimation failed: {e}")
            return 0
    
    def _estimate_peer_anomalies(self, device_df: pd.DataFrame, params: Dict) -> int:
        """Estimate peer comparison anomalies count (simplified)"""
        try:
            exceed_percentage = params.get('peer_exceed_percentage', 150.0) / 100.0
            
            # For estimation, use device's own median as "peer average"
            # In real implementation, this would use actual peer data
            peer_baseline = device_df['power'].median()
            
            peer_anomalies = device_df[device_df['power'] > peer_baseline * exceed_percentage]
            return len(peer_anomalies)
            
        except Exception as e:
            logger.warning(f"Peer anomaly estimation failed: {e}")
            return 0

# 創建服務實例
anomaly_rules = AnomalyRulesService()
