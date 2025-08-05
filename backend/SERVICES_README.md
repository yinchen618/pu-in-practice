# Backend Services 架構說明

## 概述

已成功整合並分離 ammeter 和 testbed 功能，避免重複代碼，提高代碼可維護性。

## 服務架構

### 1. Ammeter Service (`services/ammeter_service.py`)

**職責**: 專門處理電表相關的數據獲取和管理

**主要功能**:
- 電表設備清單管理
- 電表詳情獲取
- 電表統計資料計算
- 設備資訊查詢

**API 端點**:
- `/api/ammeters/` - 獲取所有電表詳情
- `/api/ammeters/statistics` - 獲取電表統計資料

**路由檔案**: `routes/ammeters.py`

### 2. Testbed Service (`services/testbed_service.py`)

**職責**: 專門處理 Testbed 研究平台相關功能

**主要功能**:
- Testbed 概覽統計
- 住宅單元管理
- 電表歷史數據分析
- 事件標註生成

**API 端點**:
- `/api/testbed/overview` - 獲取 Testbed 概覽
- `/api/testbed/units` - 獲取住宅單元列表
- `/api/testbed/meter-data` - 獲取電表數據 (已棄用)
- `/api/testbed/ammeter-history` - 獲取電表歷史數據

**路由檔案**: `routes/testbed.py`

## 服務分離原則

### Ammeter Service 負責:
- ✅ 電表設備清單載入和管理
- ✅ 電表即時狀態獲取
- ✅ 電表統計資料計算
- ✅ 設備資訊查詢

### Testbed Service 負責:
- ✅ Testbed 概覽統計
- ✅ 住宅單元分組和管理
- ✅ 房間資訊解析
- ✅ 歷史數據分析
- ✅ 事件標註生成

### 共享功能:
- ✅ Testbed Service 使用 Ammeter Service 的設備查詢功能
- ✅ 避免重複的 CSV 檔案載入邏輯

## 檔案結構

```
backend/
├── services/
│   ├── __init__.py
│   ├── ammeter_service.py      # 電表服務
│   └── testbed_service.py      # Testbed 服務
├── routes/
│   ├── ammeters.py             # 電表路由
│   └── testbed.py              # Testbed 路由
├── main.py                     # 主應用程式
├── meter.csv                   # 電表對應資料
└── test_integration.py         # 整合測試腳本
```

## 主要改進

### 1. 消除重複代碼
- ❌ 之前: 兩個服務都有相同的電表設備載入邏輯
- ✅ 現在: 只有 Ammeter Service 負責設備管理

### 2. 明確職責分離
- ❌ 之前: Testbed Service 包含電表管理功能
- ✅ 現在: 各自專注於自己的核心功能

### 3. 改善依賴關係
- ❌ 之前: 路由直接使用資料庫管理器
- ✅ 現在: 路由使用專門的服務層

### 4. 統一錯誤處理
- ✅ 所有服務使用一致的錯誤處理模式
- ✅ 提供詳細的錯誤訊息

## 使用方式

### 1. 啟動服務
```bash
cd backend
python main.py
```

### 2. 運行整合測試
```bash
python test_integration.py
```

### 3. API 端點測試

**電表相關**:
```bash
curl http://localhost:8000/api/ammeters/
curl http://localhost:8000/api/ammeters/statistics
```

**Testbed 相關**:
```bash
curl http://localhost:8000/api/testbed/overview
curl http://localhost:8000/api/testbed/units
curl http://localhost:8000/api/testbed/ammeter-history?building=a&meter_number=102&start_date=2025-01-01&end_date=2025-01-31
```

## 資料流程

### 電表數據流程:
1. `meter.csv` → `AmmeterService` → 設備清單
2. 資料庫 → `AmmeterService` → 即時狀態
3. `AmmeterService` → `routes/ammeters.py` → API 回應

### Testbed 數據流程:
1. `AmmeterService` → `TestbedService` → 單元分組
2. 資料庫 → `TestbedService` → 歷史數據
3. `TestbedService` → `routes/testbed.py` → API 回應

## 維護指南

### 添加新的電表功能:
1. 在 `AmmeterService` 中添加新方法
2. 在 `routes/ammeters.py` 中添加新端點

### 添加新的 Testbed 功能:
1. 在 `TestbedService` 中添加新方法
2. 在 `routes/testbed.py` 中添加新端點

### 修改電表對應關係:
1. 更新 `meter.csv` 檔案
2. 重啟服務以重新載入設備清單

## 注意事項

1. **服務依賴**: Testbed Service 依賴 Ammeter Service 的設備查詢功能
2. **資料庫連接**: 確保資料庫服務正在運行
3. **CSV 檔案**: 確保 `meter.csv` 檔案存在且格式正確
4. **錯誤處理**: 所有服務都包含適當的錯誤處理和日誌記錄

## 未來改進

1. **快取機制**: 為電表設備清單添加快取
2. **資料驗證**: 增強 CSV 資料的驗證邏輯
3. **監控指標**: 添加服務健康檢查端點
4. **文檔生成**: 自動生成 API 文檔 
