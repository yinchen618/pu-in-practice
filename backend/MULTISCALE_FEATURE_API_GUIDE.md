# 多尺度時間窗口特徵提取 API 指南

## 🎯 概述

這個增強版的 nnPU 訓練 API 支持基於前端滑桿設定的多尺度時間窗口特徵提取。用戶可以通過調整 "Data Preparation" 滑桿來控制特徵工程的時間窗口大小。

## 📏 時間窗口計算邏輯

當用戶設定主要時間窗口為 `N` 分鐘時，系統會自動計算：

- **短期窗口 (Short Window)** = `N ÷ 2` 分鐘 (最小15分鐘)
- **中期窗口 (Medium Window)** = `N` 分鐘 (用戶設定值)
- **長期窗口 (Long Window)** = `N × 4` 分鐘

### 範例：
- 用戶設定 60 分鐘 → 短期30分鐘, 中期60分鐘, 長期240分鐘
- 用戶設定 90 分鐘 → 短期45分鐘, 中期90分鐘, 長期360分鐘
- 用戶設定 30 分鐘 → 短期15分鐘, 中期30分鐘, 長期120分鐘

## 🚀 API 使用方法

### 創建訓練模型 API

**端點**: `POST /api/v2/training-jobs`

**請求 Body 範例**:

```json
{
  "model_name": "多尺度特徵 nnPU 模型",
  "scenario_type": "ERM_BASELINE", 
  "experiment_run_id": "您的實驗ID",
  "training_config": {
    "algorithm": "nnPU",
    "epochs": 50,
    "learning_rate": 0.001,
    "hidden_dim": 128,
    "feature_engineering": {
      "main_window_size_minutes": 60  // 🎯 來自前端滑桿的值
    }
  },
  "data_source_config": {
    "use_analysis_ready_data": true
  }
}
```

### 前端集成示例

```typescript
// 假設前端有一個滑桿組件
const timeWindowSlider = 60; // 用戶設定的分鐘數

const trainingRequest = {
  model_name: `時間窗口${timeWindowSlider}分鐘-nnPU模型`,
  scenario_type: "ERM_BASELINE",
  experiment_run_id: currentExperimentId,
  training_config: {
    algorithm: "nnPU",
    epochs: 50,
    learning_rate: 0.001,
    hidden_dim: 128,
    feature_engineering: {
      main_window_size_minutes: timeWindowSlider // 🎯 關鍵參數
    }
  },
  data_source_config: {
    use_analysis_ready_data: true
  }
};

// 發送訓練請求
fetch('/api/v2/training-jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(trainingRequest)
});
```

## 📊 特徵向量結構

新的多尺度特徵提取會產生 **33 維特徵向量**：

### 基礎特徵 (5 維)
1. 原始L1功率
2. 原始L2功率  
3. 110V功率
4. 220V功率
5. 總功率

### 時間窗口統計特徵 (24 維)
每個窗口 (短期/中期/長期) 各自計算 8 個統計特徵：
- 平均功率、功率標準差、最大功率、最小功率
- 中位數功率、高功率事件計數、L1-L2平均差值、變化劇烈程度

### 跨窗口比較特徵 (4 維)
- 短期/中期功率比率
- 中期/長期功率比率
- 短期/長期功率比率
- 短期vs中期變異性比率

## 🎯 訓練結果示例

```json
{
  "algorithm": "nnPU",
  "epochs": 20,
  "learning_rate": 0.01,
  "hidden_dim": 64,
  "final_risk": 0.0,
  "p_samples": 1191,
  "u_samples": 5000,
  "class_prior": 0.192,
  "mean_prediction": 0.932,
  "std_prediction": 0.156,
  "feature_dimensions": 33,
  "window_config": {
    "short_window": 45,
    "medium_window": 90, 
    "long_window": 360
  }
}
```

## ✅ 成功測試案例

- ✅ **60分鐘窗口**: 1,191 正樣本, 5,000 未標記樣本, 10維 → 33維特徵
- ✅ **90分鐘窗口**: 1,191 正樣本, 5,000 未標記樣本, 33維特徵, 訓練成功

## 🔧 技術優化

1. **時間索引**: 建立高效的時間戳索引字典，提升窗口查詢效率
2. **容錯處理**: 當窗口內樣本不足時，使用當前值進行智能填充
3. **記憶體優化**: 分批處理大量樣本，避免記憶體溢出
4. **WebSocket 回饋**: 實時顯示特徵提取進度和窗口配置資訊

這個增強版特徵提取功能，讓您的 PU Learning 模型能夠捕捉到更豐富的時間序列模式，大幅提升異常檢測的準確性！🚀
