"""
模型訓練服務 - PU Learning 模型訓練的核心邏輯
負責將標註數據轉換為 PU Learning 格式並進行模型訓練
"""

import pandas as pd
import numpy as np
import joblib
import asyncio
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime
import logging
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report
import sys

# 添加 PU Learning 模組路徑
current_dir = os.path.dirname(os.path.abspath(__file__))
pu_learning_dir = os.path.join(os.path.dirname(current_dir), 'pu-learning')
sys.path.append(pu_learning_dir)

try:
    from pulearning_engine import run_pu_simulation
    # from models import SimulationRequest, DataParams, ModelParams
    # 由於導入問題，我們暫時定義簡化的類
    class DataParams:
        def __init__(self, distribution, dims, n_p, n_u, prior):
            self.distribution = distribution
            self.dims = dims
            self.n_p = n_p
            self.n_u = n_u
            self.prior = prior
    
    class ModelParams:
        def __init__(self, activation, n_epochs):
            self.activation = activation
            self.n_epochs = n_epochs
            
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"無法載入 PU Learning 模組: {e}")
    
    # 定義簡化的類以避免導入錯誤
    class DataParams:
        def __init__(self, distribution, dims, n_p, n_u, prior):
            self.distribution = distribution
            self.dims = dims
            self.n_p = n_p
            self.n_u = n_u
            self.prior = prior
    
    class ModelParams:
        def __init__(self, activation, n_epochs):
            self.activation = activation
            self.n_epochs = n_epochs

from core.database import db_manager

logger = logging.getLogger(__name__)

class TrainingService:
    """模型訓練服務 - 封裝 PU Learning 模型訓練邏輯"""
    
    def __init__(self):
        self.models_dir = Path(__file__).parent.parent / "trained_models"
        self.models_dir.mkdir(exist_ok=True)
        
    async def prepare_training_data(self, organization_id: str) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        準備 PU Learning 訓練數據
        Returns:
            X: 特徵矩陣
            y: 標籤向量 (1: 正樣本, -1: 可靠負樣本, 0: 未標註樣本)
            summary: 數據摘要
        """
        logger.info(f"準備組織 {organization_id} 的訓練數據...")
        
        try:
            # 從資料庫獲取已標註的異常事件
            async with db_manager.get_session() as session:
                from sqlalchemy import text
                
                # 查詢異常事件及其標籤
                query = """
                SELECT 
                    ae.id, ae.meterId, ae.eventTimestamp, ae.score, ae.dataWindow,
                    ae.status, al.name as label_name
                FROM anomaly_event ae
                LEFT JOIN event_label_link ell ON ae.id = ell.eventId
                LEFT JOIN anomaly_label al ON ell.labelId = al.id
                WHERE ae.organizationId = :org_id
                ORDER BY ae.eventTimestamp
                """
                
                result = await session.execute(text(query), {"org_id": organization_id})
                events = result.fetchall()
            
            if not events:
                raise ValueError("未找到已標註的異常事件數據")
            
            # 轉換為 DataFrame
            events_data = []
            for event in events:
                events_data.append({
                    'id': event.id,
                    'meterId': event.meterId,
                    'eventTimestamp': event.eventTimestamp,
                    'score': event.score,
                    'dataWindow': event.dataWindow,
                    'status': event.status,
                    'label_name': event.label_name
                })
            
            df = pd.DataFrame(events_data)
            
            # 提取特徵
            X, feature_names = self._extract_features(df)
            
            # 轉換標籤為 PU Learning 格式
            y = self._convert_labels_to_pu_format(df)
            
            # 生成數據摘要
            summary = {
                'total_samples': len(df),
                'positive_samples': int(np.sum(y == 1)),
                'reliable_negative_samples': int(np.sum(y == -1)),
                'unlabeled_samples': int(np.sum(y == 0)),
                'feature_count': X.shape[1],
                'feature_names': feature_names,
                'data_time_range': {
                    'start': df['eventTimestamp'].min().isoformat(),
                    'end': df['eventTimestamp'].max().isoformat()
                },
                'meters_involved': df['meterId'].nunique(),
                'preparation_time': datetime.utcnow().isoformat()
            }
            
            logger.info(f"數據準備完成: {summary}")
            return X, y, summary
            
        except Exception as e:
            logger.error(f"數據準備失敗: {e}")
            raise

    async def prepare_training_data_for_experiment_run(self, experiment_run_id: str) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """根據指定的 experiment_run 載入標註事件作為訓練集，轉成 PU 格式並抽取特徵。"""
        logger.info(f"準備實驗批次 {experiment_run_id} 的訓練數據...")
        try:
            from core.database import db_manager
            from sqlalchemy import text

            async with db_manager.get_session() as session:
                query = """
                SELECT 
                    ae.id, ae."meterId" AS meterId, ae."eventTimestamp" AS eventTimestamp, ae.score, ae."dataWindow" AS dataWindow,
                    ae.status, NULL::text AS label_name
                FROM anomaly_event ae
                WHERE ae."experimentRunId" = :run_id
                ORDER BY ae."eventTimestamp"
                """
                result = await session.execute(text(query), {"run_id": experiment_run_id})
                rows = result.fetchall()

            if not rows:
                raise ValueError("No labeled events found for the specified experiment run")

            events_data: List[Dict[str, Any]] = []
            import json as _json
            for row in rows:
                data_window = row.dataWindow
                if isinstance(data_window, str):
                    try:
                        data_window = _json.loads(data_window)
                    except Exception:
                        data_window = None

                events_data.append({
                    'id': row.id,
                    'meterId': row.meterId,
                    'eventTimestamp': row.eventTimestamp,
                    'score': row.score,
                    'dataWindow': data_window,
                    'status': row.status,
                    'label_name': None,
                })

            df = pd.DataFrame(events_data)
            X, feature_names = self._extract_features(df)
            y = self._convert_labels_to_pu_format(df)

            summary = {
                'total_samples': len(df),
                'positive_samples': int(np.sum(y == 1)),
                'reliable_negative_samples': int(np.sum(y == -1)),
                'unlabeled_samples': int(np.sum(y == 0)),
                'feature_count': X.shape[1],
                'feature_names': feature_names,
                'data_time_range': {
                    'start': df['eventTimestamp'].min().isoformat(),
                    'end': df['eventTimestamp'].max().isoformat()
                },
                'meters_involved': int(df['meterId'].nunique()),
                'preparation_time': datetime.utcnow().isoformat()
            }

            logger.info(f"實驗批次數據準備完成: {summary}")
            return X, y, summary
        except Exception as e:
            logger.error(f"prepare_training_data_for_experiment_run 失敗: {e}")
            raise
    
    def _extract_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """從異常事件中提取特徵"""
        features = []
        feature_names = []
        
        for _, row in df.iterrows():
            feature_vector = []
            
            # 基本特徵
            feature_vector.append(row['score'])  # 異常分數
            feature_names_basic = ['anomaly_score']
            
            # 時間特徵
            timestamp = pd.to_datetime(row['eventTimestamp'])
            feature_vector.extend([
                timestamp.hour,          # 小時
                timestamp.weekday(),     # 星期幾
                timestamp.day,          # 日期
                timestamp.month         # 月份
            ])
            feature_names_time = ['hour', 'weekday', 'day', 'month']
            
            # 數據窗口特徵（如果有的話）
            if row['dataWindow'] and isinstance(row['dataWindow'], dict):
                data_window = row['dataWindow']
                
                if 'values' in data_window and data_window['values']:
                    values = np.array(data_window['values'])
                    feature_vector.extend([
                        np.mean(values),        # 平均值
                        np.std(values),         # 標準差
                        np.max(values),         # 最大值
                        np.min(values),         # 最小值
                        np.median(values),      # 中位數
                        len(values)             # 數據點數量
                    ])
                    feature_names_window = ['window_mean', 'window_std', 'window_max', 
                                          'window_min', 'window_median', 'window_length']
                else:
                    # 如果沒有數據窗口，用零填充
                    feature_vector.extend([0, 0, 0, 0, 0, 0])
                    feature_names_window = ['window_mean', 'window_std', 'window_max', 
                                          'window_min', 'window_median', 'window_length']
            else:
                feature_vector.extend([0, 0, 0, 0, 0, 0])
                feature_names_window = ['window_mean', 'window_std', 'window_max', 
                                      'window_min', 'window_median', 'window_length']
            
            # 合併特徵名稱（只在第一次迭代時）
            if not feature_names:
                feature_names = feature_names_basic + feature_names_time + feature_names_window
            
            features.append(feature_vector)
        
        return np.array(features), feature_names
    
    def _convert_labels_to_pu_format(self, df: pd.DataFrame) -> np.ndarray:
        """
        將異常事件標籤轉換為 PU Learning 格式
        1: 正樣本（任何非正常標籤）
        -1: 可靠負樣本（標記為"正常"的樣本）
        0: 未標註樣本
        """
        y = np.zeros(len(df))
        
        for i, row in df.iterrows():
            if row['status'] == 'CONFIRMED_POSITIVE':
                y[i] = 1  # 確認的異常
            elif row['status'] == 'REJECTED_NORMAL':
                y[i] = -1  # 確認的正常
            elif row['label_name'] == 'Verified Normal':
                y[i] = -1  # 明確標記為正常
            elif row['label_name'] and row['label_name'] != 'Verified Normal':
                y[i] = 1   # 有其他標籤的被視為異常
            else:
                y[i] = 0   # 未標註
        
        return y
    
    async def train_pu_model_in_background(
        self, 
        model_name: str,
        model_type: str,
        organization_id: str,
        model_params: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        在背景執行 PU Learning 模型訓練
        
        Args:
            model_name: 模型名稱
            model_type: 模型類型 ("uPU" 或 "nnPU")
            organization_id: 組織ID
            model_params: 模型參數
            
        Returns:
            訓練好的模型ID
        """
        try:
            logger.info(f"開始訓練 {model_type} 模型: {model_name}")
            
            # 準備訓練數據
            X, y, data_summary = await self.prepare_training_data(organization_id)
            
            # 檢查數據是否足夠
            positive_count = np.sum(y == 1)
            negative_count = np.sum(y == -1)
            
            if positive_count < 10:
                raise ValueError(f"正樣本數量不足: {positive_count} < 10")
            if negative_count < 10:
                raise ValueError(f"負樣本數量不足: {negative_count} < 10")
            
            # 資料預處理
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # 分割數據用於評估
            # 注意：在 PU Learning 中，我們只用有標籤的數據來評估
            labeled_mask = y != 0
            X_labeled = X_scaled[labeled_mask]
            y_labeled = y[labeled_mask]
            
            # 轉換為二元分類標籤用於評估 (1 -> 1, -1 -> 0)
            y_binary = (y_labeled == 1).astype(int)
            
            # 分割標註數據用於訓練和測試
            if len(X_labeled) >= 20:  # 至少20個標註樣本才分割
                X_train_labeled, X_test_labeled, y_train_binary, y_test_binary = train_test_split(
                    X_labeled, y_binary, test_size=0.3, random_state=42, stratify=y_binary
                )
            else:
                # 數據太少，使用全部數據
                X_train_labeled = X_labeled
                X_test_labeled = X_labeled
                y_train_binary = y_binary
                y_test_binary = y_binary
            
            # 使用 PU Learning 演算法訓練
            if model_type.lower() == 'upu':
                trained_model, metrics = await self._train_upu_model(
                    X_scaled, y, X_test_labeled, y_test_binary, model_params
                )
            elif model_type.lower() == 'nnpu':
                trained_model, metrics = await self._train_nnpu_model(
                    X_scaled, y, X_test_labeled, y_test_binary, model_params
                )
            else:
                raise ValueError(f"不支援的模型類型: {model_type}")
            
            # 儲存模型
            model_path = self.models_dir / f"{model_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.joblib"
            
            model_data = {
                'model': trained_model,
                'scaler': scaler,
                'feature_names': data_summary['feature_names'],
                'model_type': model_type,
                'training_params': model_params or {},
                'data_summary': data_summary
            }
            
            joblib.dump(model_data, model_path)
            logger.info(f"模型已儲存至: {model_path}")
            
            # 將模型資訊存入資料庫
            model_id = await self._save_model_to_database(
                model_name=model_name,
                model_type=model_type,
                model_path=str(model_path),
                metrics=metrics,
                data_summary=data_summary,
                organization_id=organization_id
            )
            
            logger.info(f"模型訓練完成: {model_id}")
            return model_id
            
        except Exception as e:
            logger.error(f"模型訓練失敗: {e}")
            raise
    
    async def _train_upu_model(
        self, 
        X: np.ndarray, 
        y: np.ndarray, 
        X_test: np.ndarray, 
        y_test: np.ndarray,
        params: Optional[Dict] = None
    ) -> Tuple[Any, Dict[str, float]]:
        """訓練 uPU 模型"""
        try:
            # 使用現有的 PU Learning 引擎
            data_params = DataParams(
                distribution='custom',  # 使用自定義數據
                dims=X.shape[1],
                n_p=int(np.sum(y == 1)),
                n_u=int(np.sum(y == 0)),
                prior=float(np.sum(y == 1) / (np.sum(y == 1) + np.sum(y == 0)))
            )
            
            model_params = ModelParams(
                activation=params.get('activation', 'relu') if params else 'relu',
                n_epochs=params.get('n_epochs', 100) if params else 100
            )
            
            # 模擬訓練（實際應用中需要適配現有的 PU Learning 程式碼）
            # 這裡提供一個簡化版本
            from sklearn.linear_model import LogisticRegression
            
            # 準備 PU Learning 數據
            X_positive = X[y == 1]
            X_unlabeled = X[y == 0]
            X_reliable_negative = X[y == -1]
            
            # 簡化的 uPU 實現：使用可靠負樣本作為負樣本
            if len(X_reliable_negative) > 0:
                X_train = np.vstack([X_positive, X_reliable_negative])
                y_train = np.hstack([np.ones(len(X_positive)), np.zeros(len(X_reliable_negative))])
            else:
                # 如果沒有可靠負樣本，使用一些未標註樣本作為負樣本
                n_negative = min(len(X_positive), len(X_unlabeled) // 2)
                X_train = np.vstack([X_positive, X_unlabeled[:n_negative]])
                y_train = np.hstack([np.ones(len(X_positive)), np.zeros(n_negative)])
            
            # 訓練邏輯回歸模型
            model = LogisticRegression(random_state=42)
            model.fit(X_train, y_train)
            
            # 評估模型
            y_pred = model.predict(X_test)
            
            metrics = {
                'precision': float(precision_score(y_test, y_pred, zero_division=0)),
                'recall': float(recall_score(y_test, y_pred, zero_division=0)),
                'f1_score': float(f1_score(y_test, y_pred, zero_division=0))
            }
            
            return model, metrics
            
        except Exception as e:
            logger.error(f"uPU 模型訓練失敗: {e}")
            raise
    
    async def _train_nnpu_model(
        self, 
        X: np.ndarray, 
        y: np.ndarray, 
        X_test: np.ndarray, 
        y_test: np.ndarray,
        params: Optional[Dict] = None
    ) -> Tuple[Any, Dict[str, float]]:
        """訓練 nnPU 模型"""
        try:
            # 這裡應該整合現有的 nnPU 實現
            # 暫時使用簡化版本
            from sklearn.ensemble import RandomForestClassifier
            
            # 準備數據
            X_positive = X[y == 1]
            X_unlabeled = X[y == 0]
            X_reliable_negative = X[y == -1]
            
            # 簡化的 nnPU 實現
            if len(X_reliable_negative) > 0:
                X_train = np.vstack([X_positive, X_reliable_negative])
                y_train = np.hstack([np.ones(len(X_positive)), np.zeros(len(X_reliable_negative))])
            else:
                n_negative = min(len(X_positive), len(X_unlabeled) // 2)
                X_train = np.vstack([X_positive, X_unlabeled[:n_negative]])
                y_train = np.hstack([np.ones(len(X_positive)), np.zeros(n_negative)])
            
            # 使用隨機森林（更適合處理非線性關係）
            model = RandomForestClassifier(
                n_estimators=params.get('n_estimators', 100) if params else 100,
                random_state=42
            )
            model.fit(X_train, y_train)
            
            # 評估模型
            y_pred = model.predict(X_test)
            
            metrics = {
                'precision': float(precision_score(y_test, y_pred, zero_division=0)),
                'recall': float(recall_score(y_test, y_pred, zero_division=0)),
                'f1_score': float(f1_score(y_test, y_pred, zero_division=0))
            }
            
            return model, metrics
            
        except Exception as e:
            logger.error(f"nnPU 模型訓練失敗: {e}")
            raise

    async def predict_on_timerange(
        self,
        model_artifact_path: str,
        start_date_iso: str,
        end_date_iso: str,
        exclude_windows: Optional[List[Tuple[str, datetime, datetime]]] = None,
        window_minutes: int = 30,
        gap_minutes: int = 5,
    ) -> Dict[str, Any]:
        """
        使用保存的模型在 ammeter_log 指定區間進行批次預測。
        exclude_windows: list of (meterId, start_ts, end_ts) to guard leakage.
        """
        try:
            import json as _json
            from .data_loader import data_loader

            # Parse date or datetime ISO strings
            def _parse_iso(s: str) -> datetime:
                try:
                    return datetime.fromisoformat(s)
                except Exception:
                    # If a pure date is provided, assume full-day bounds
                    from datetime import time as dtime
                    d = datetime.fromisoformat(s + "T00:00:00").date()
                    return datetime.combine(d, dtime.min)

            start_dt = _parse_iso(start_date_iso)
            end_dt = _parse_iso(end_date_iso)

            df = await data_loader.get_raw_dataframe(start_datetime=start_dt, end_datetime=end_dt)
            if df.empty:
                return {"predictions": [], "total": 0}

            # 聚合為固定視窗，避免不規則時間戳造成問題
            # 使用 30 分鐘視窗，按 device 分組
            df = df.copy()
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)

            window_feats: List[Dict[str, Any]] = []
            for device, g in df.groupby('deviceNumber'):
                # 以固定頻率重採樣，避免太稀疏
                rg = g.resample(f"{gap_minutes}T").mean().dropna(how='all')
                # 以 30 分鐘為窗，使用右閉區間標記窗起點
                rolling = rg['power'].rolling(f"{window_minutes}T")
                feat_df = pd.DataFrame({
                    'window_mean': rolling.mean(),
                    'window_std': rolling.std(),
                    'window_max': rolling.max(),
                    'window_min': rolling.min(),
                    'window_median': rolling.median(),
                    'window_length': rolling.count(),
                }).dropna()
                feat_df['deviceNumber'] = device
                feat_df['hour'] = feat_df.index.hour
                feat_df['weekday'] = feat_df.index.weekday
                feat_df['day'] = feat_df.index.day
                feat_df['month'] = feat_df.index.month

                # 轉回記錄
                for idx, row in feat_df.iterrows():
                    window_start = idx - pd.Timedelta(minutes=window_minutes)
                    window_feats.append({
                        'meterId': device,
                        'window_start': window_start.to_pydatetime(),
                        'features': [
                            # 順序需與訓練時對齊：anomaly_score(無,補0) + time + window stats
                            0.0,
                            row['hour'], row['weekday'], row['day'], row['month'],
                            row['window_mean'], row['window_std'], row['window_max'],
                            row['window_min'], row['window_median'], row['window_length']
                        ]
                    })

            if not window_feats:
                return {"predictions": [], "total": 0}

            # 洩漏防護：排除與訓練事件重疊之窗
            if exclude_windows:
                def overlap(meter: str, ws: datetime) -> bool:
                    for mid, s, e in exclude_windows:
                        if meter == mid and s <= ws <= e:
                            return True
                    return False
                window_feats = [w for w in window_feats if not overlap(w['meterId'], w['window_start'])]

            # 載入模型
            model_data = joblib.load(model_artifact_path)
            model = model_data['model']
            scaler = model_data['scaler']

            X_pred = np.array([w['features'] for w in window_feats])
            # 尺度化：與訓練時特徵維度一致（這裡使用相同的欄位順序）
            # 若特徵數不一致，嘗試對齊長度
            try:
                X_pred_scaled = scaler.transform(X_pred)
            except Exception:
                # 退而求其次：用訓練特徵長度裁切或補零
                train_dim = scaler.mean_.shape[0]
                if X_pred.shape[1] > train_dim:
                    X_pred = X_pred[:, :train_dim]
                elif X_pred.shape[1] < train_dim:
                    pad = np.zeros((X_pred.shape[0], train_dim - X_pred.shape[1]))
                    X_pred = np.hstack([X_pred, pad])
                X_pred_scaled = scaler.transform(X_pred)

            # 預測分數
            if hasattr(model, 'predict_proba'):
                scores = model.predict_proba(X_pred_scaled)[:, 1]
            else:
                # 兼容 linear model
                raw = model.decision_function(X_pred_scaled)
                scores = 1 / (1 + np.exp(-raw))

            predictions = [
                {
                    'meter_id': w['meterId'],
                    'window_start_ts': w['window_start'].isoformat(),
                    'score': float(s),
                    'y_hat': 1 if s >= 0.5 else 0,
                }
                for w, s in zip(window_feats, scores)
            ]

            # 取 Top-K（100）
            predictions_sorted = sorted(predictions, key=lambda x: x['score'], reverse=True)[:100]

            return {
                'predictions': predictions_sorted,
                'total': len(predictions),
            }
        except Exception as e:
            logger.error(f"predict_on_timerange 失敗: {e}")
            raise
    
    async def _save_model_to_database(
        self,
        model_name: str,
        model_type: str,
        model_path: str,
        metrics: Dict[str, float],
        data_summary: Dict[str, Any],
        organization_id: str
    ) -> str:
        """將模型資訊儲存到資料庫"""
        try:
            async with db_manager.get_session() as session:
                from sqlalchemy import text
                
                query = """
                INSERT INTO trained_model (
                    id, modelName, modelType, modelPath, precision, recall, f1Score,
                    trainingDataSummary, organizationId, createdAt, updatedAt
                ) VALUES (
                    gen_random_uuid()::text, :model_name, :model_type, :model_path,
                    :precision, :recall, :f1_score, :training_data_summary,
                    :organization_id, NOW(), NOW()
                ) RETURNING id
                """
                
                result = await session.execute(text(query), {
                    'model_name': model_name,
                    'model_type': model_type,
                    'model_path': model_path,
                    'precision': metrics['precision'],
                    'recall': metrics['recall'],
                    'f1_score': metrics['f1_score'],
                    'training_data_summary': data_summary,
                    'organization_id': organization_id
                })
                
                model_id = result.scalar()
                await session.commit()
                
                return model_id
                
        except Exception as e:
            logger.error(f"儲存模型到資料庫失敗: {e}")
            raise
    
    async def get_latest_model_results(self, organization_id: str) -> Optional[Dict[str, Any]]:
        """獲取最新的模型訓練結果"""
        try:
            async with db_manager.get_session() as session:
                from sqlalchemy import text
                
                query = """
                SELECT *
                FROM trained_model
                WHERE organizationId = :organization_id
                ORDER BY createdAt DESC
                LIMIT 1
                """
                
                result = await session.execute(text(query), {
                    'organization_id': organization_id
                })
                
                model_record = result.first()
                
                if not model_record:
                    return None
                
                return {
                    'id': model_record.id,
                    'modelName': model_record.modelName,
                    'modelType': model_record.modelType,
                    'precision': float(model_record.precision),
                    'recall': float(model_record.recall),
                    'f1Score': float(model_record.f1Score),
                    'trainingDataSummary': model_record.trainingDataSummary,
                    'createdAt': model_record.createdAt.isoformat(),
                    'updatedAt': model_record.updatedAt.isoformat()
                }
                
        except Exception as e:
            logger.error(f"獲取最新模型結果失敗: {e}")
            return None

# 創建服務實例
training_service = TrainingService()
