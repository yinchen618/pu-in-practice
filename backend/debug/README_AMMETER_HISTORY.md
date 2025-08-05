# 電表歷史資料功能說明

## 概述

本功能將電表 API 回應資料分解並儲存到 `AmmeterLog` 表中，方便進行歷史查詢和分析。

## 資料庫結構

### Ammeter 表（最新狀態）
- 儲存電表的最新狀態
- 每次同步都會覆蓋更新
- 用於即時監控和顯示

### AmmeterLog 表（歷史記錄）
- 記錄所有 API 請求
- 對於 `ammeterDetail` 請求，會將 responseData 分解成以下欄位：
  - `factory`: 廠商
  - `device`: 設備
  - `voltage`: 電壓 (V)
  - `currents`: 電流 (A)
  - `power`: 功率 (W)
  - `battery`: 累計用電 (kWh)
  - `switchState`: 開關狀態 (1: 開啟, 0: 關閉)
  - `networkState`: 網路狀態 (1: 正常, 0: 斷網)
  - `lastUpdated`: 最後更新時間

## API 端點

### 1. 獲取電表日誌
```
GET /api/ammeter/logs?device_number={device_number}&limit={limit}
```

### 2. 獲取電表歷史資料
```
GET /api/ammeter/history/{device_number}?start_date={start_date}&end_date={end_date}&limit={limit}
```

參數說明：
- `device_number`: 設備編號
- `start_date`: 開始日期 (ISO 格式，可選)
- `end_date`: 結束日期 (ISO 格式，可選)
- `limit`: 限制記錄數量 (預設 1000)

### 3. 獲取電表統計資料
```
GET /api/ammeter/statistics/{device_number}?days={days}
```

參數說明：
- `device_number`: 設備編號
- `days`: 統計天數 (1-365，預設 7)

## 使用範例

### 1. 獲取最近 7 天的統計資料
```bash
curl "http://localhost:8000/api/ammeter/statistics/402A8FB02535?days=7"
```

回應範例：
```json
{
  "success": true,
  "data": {
    "deviceNumber": "402A8FB02535",
    "period": "7天",
    "totalRecords": 1008,
    "averageVoltage": 110.5,
    "averageCurrent": 2.3,
    "averagePower": 254.2,
    "totalBattery": 45.67,
    "onlineRate": 0.98,
    "activeRate": 0.85
  },
  "message": "成功獲取電表 402A8FB02535 的統計資料"
}
```

### 2. 獲取指定日期範圍的歷史資料
```bash
curl "http://localhost:8000/api/ammeter/history/402A8FB02535?start_date=2024-01-01T00:00:00&end_date=2024-01-02T00:00:00&limit=100"
```

### 3. 獲取所有電表日誌
```bash
curl "http://localhost:8000/api/ammeter/logs?limit=50"
```

## 測試

執行測試腳本：
```bash
cd backend
python test_history.py
```

## 資料流程

1. **Cron 任務執行** (`cron_ammeter.py`)
   - 呼叫 `get_ammeter_detail()` 獲取電表資料
   - 自動儲存到 `Ammeter` 表（最新狀態）

2. **API 請求記錄** (`ammeters_api.py`)
   - `make_api_request()` 記錄所有 API 請求到 `AmmeterLog`
   - 對於 `ammeterDetail` 請求，自動解析 responseData 並儲存到新欄位

3. **歷史查詢**
   - 透過 API 端點查詢歷史資料
   - 支援日期範圍篩選和統計分析

## 注意事項

1. **資料解析**：只有成功的 `ammeterDetail` 請求才會解析並儲存電表資料欄位
2. **效能考量**：歷史資料會持續累積，建議定期清理舊資料
3. **日期格式**：API 使用 ISO 8601 格式 (YYYY-MM-DDTHH:MM:SS)
4. **統計計算**：
   - 平均電壓/電流/功率：所有記錄的平均值
   - 總用電量：期間內最大累計用電減去最小累計用電
   - 線上率/使用率：正常狀態記錄數除以總記錄數

## 未來擴展

1. **資料清理**：自動清理超過一定時間的歷史資料
2. **圖表分析**：提供圖表化的歷史趨勢分析
3. **異常檢測**：基於歷史資料的異常值檢測
4. **報表功能**：生成用電量報表和統計報表 
