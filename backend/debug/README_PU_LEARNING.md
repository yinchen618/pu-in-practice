# PU Learning 後端服務

這是一個基於 FastAPI 的 PU Learning 模擬引擎後端服務，實現了 uPU 和 nnPU 演算法。

## 專案結構

```
backend/
├── pu-learning/              # PU Learning 核心模組
│   ├── __init__.py          # 模組初始化
│   ├── models.py            # Pydantic 模型定義
│   ├── data_generator.py    # 數據生成器
│   └── pulearning_engine.py # 核心演算法實現
├── pu_main.py               # FastAPI 主應用
├── start_pu_server.py       # 服務啟動腳本
├── test_pu_backend.py       # 測試腳本
├── requirements.txt         # 依賴列表
└── README_PU_LEARNING.md    # 本文檔
```

## 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

## 啟動服務

### 方法 1: 使用啟動腳本
```bash
python start_pu_server.py
```

### 方法 2: 直接使用 uvicorn
```bash
uvicorn pu_main:app --host 127.0.0.1 --port 8000 --reload
```

服務啟動後，可以在以下位置訪問：
- 服務地址: http://localhost:8000
- API 文檔: http://localhost:8000/docs
- 健康檢查: http://localhost:8000/health

## API 端點

### 1. 運行模擬 (POST /api/run-simulation)

這是核心端點，用於執行 PU Learning 模擬。

**請求格式:**
```json
{
  "algorithm": "nnPU",  // "uPU" 或 "nnPU"
  "data_params": {
    "distribution": "two_moons",  // "two_moons", "gaussian", "spiral", "complex"
    "dims": 2,           // 數據維度 (1-100)
    "n_p": 50,          // 正樣本數量
    "n_u": 300,         // 未標記樣本數量
    "prior": 0.3        // 類別先驗 (0.05-0.95)
  },
  "model_params": {
    "activation": "relu",     // "relu", "softsign", "tanh"
    "n_epochs": 50,          // 訓練週期
    "learning_rate": 0.01,   // 學習率
    "hidden_dim": 100        // 隱藏層維度
  }
}
```

**回應格式:**
```json
{
  "visualization": {
    "p_samples": [[x1, y1], [x2, y2], ...],      // 正樣本 2D 座標
    "u_samples": [[x1, y1], [x2, y2], ...],      // 未標記樣本 2D 座標
    "decision_boundary": [[x1, y1], [x2, y2], ...] // 決策邊界點
  },
  "metrics": {
    "estimated_prior": 0.32,    // 估計的類別先驗
    "error_rate": 0.15,         // 分類錯誤率
    "risk_curve": [             // 風險曲線
      {"epoch": 1, "risk": 0.8},
      {"epoch": 2, "risk": 0.7},
      ...
    ]
  },
  "success": true,
  "message": "Simulation completed successfully with nnPU algorithm"
}
```

### 2. 其他端點

- `GET /`: 服務信息
- `GET /health`: 健康檢查
- `GET /api/algorithms`: 支援的演算法列表
- `GET /api/distributions`: 支援的數據分布列表

## 演算法說明

### uPU (Unbiased PU Learning)
- **論文**: du Plessis et al., ICML 2015
- **特點**: 無偏的 PU 學習，但可能出現負風險（過擬合）
- **實現**: 基於核方法，使用交叉驗證選擇最佳參數

### nnPU (Non-negative PU Learning)
- **論文**: Kiryo et al., NIPS 2017
- **特點**: 非負風險約束，防止過擬合
- **實現**: 基於神經網路，使用 Sigmoid 損失函數

## 數據分布類型

1. **two_moons**: 兩個半月形數據，適合測試非線性分類
2. **gaussian**: 兩個高斯聚類，適合線性分類問題
3. **spiral**: 兩個交錯螺旋，複雜非線性問題
4. **complex**: 複雜合成數據，適合高維問題

## 測試

運行測試腳本檢查後端功能：

```bash
python test_pu_backend.py
```

## 前端整合

前端可以這樣呼叫 API：

```javascript
const response = await fetch('http://localhost:8000/api/run-simulation', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    algorithm: 'nnPU',
    data_params: {
      distribution: 'two_moons',
      dims: 2,
      n_p: 50,
      n_u: 300,
      prior: 0.3
    },
    model_params: {
      activation: 'relu',
      n_epochs: 50,
      learning_rate: 0.01,
      hidden_dim: 100
    }
  }),
});

const results = await response.json();
```

## 故障排除

### 1. 依賴問題
如果遇到導入錯誤，確保安裝了所有依賴：
```bash
pip install -r requirements.txt
```

### 2. PyTorch 安裝
如果 PyTorch 安裝有問題，請訪問 https://pytorch.org/ 獲取正確的安裝命令。

### 3. 模擬模式
如果某些依賴缺失，服務會自動切換到模擬模式，返回模擬數據而不是真實計算結果。

## 開發說明

### 添加新演算法
1. 在 `pulearning_engine.py` 中添加新的訓練函數
2. 在 `models.py` 中更新演算法選項
3. 在主應用中添加相應的處理邏輯

### 添加新數據分布
1. 在 `data_generator.py` 中添加新的生成函數
2. 在 `models.py` 中更新分布選項

## 參考文獻

1. M.C. du Plessis, G. Niu, and M. Sugiyama. "Convex formulation for learning from positive and unlabeled data." ICML 2015.

2. R. Kiryo, G. Niu, M.C. du Plessis, and M. Sugiyama. "Positive-unlabeled learning with non-negative risk estimator." NIPS 2017.

## 授權

本專案遵循 MIT 授權條款。
