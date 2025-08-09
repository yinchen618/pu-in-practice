# PU Learning 異常標記系統 - 前後端整合指南

## 🚀 快速啟動

### 1. 啟動 Python 後端
```bash
cd backend
python main.py
# 或使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 啟動前端
```bash
cd apps/pu
npm run dev
# 或 yarn dev / pnpm dev
```

### 3. 測試連接
開啟瀏覽器訪問：
- 前端應用：`http://localhost:3000/case-study?tab=plabeling`
- API 測試頁面：`http://localhost:3000/test-api-connection.html`
- 後端 API 文檔：`http://localhost:8000/docs`

## 📋 已完成的修改

### ✅ 後端修改 (Python)
1. **移除 organizationId 依賴**
   - `GET /api/case-study/events` - 不再需要 organization_id 參數
   - `GET /api/case-study/stats` - 簡化統計查詢
   - `GET /api/case-study/labels` - 返回固定的模擬標籤
   - `POST /api/case-study/labels` - 簡化標籤創建

2. **使用模擬服務**
   - 所有 API 使用 `mock_anomaly_service` 提供測試資料
   - 包含 100 個模擬異常事件
   - 支援分頁、搜尋、篩選功能

### ✅ 前端修改 (React/TypeScript)
1. **API 客戶端重構**
   - 基礎 URL 改為 `http://localhost:8000/api`
   - 移除所有 organizationId 相關參數
   - 更新所有 API 呼叫方法

2. **型別定義更新**
   - `AnomalyEvent` 介面移除 organizationId
   - `AnomalyLabel` 介面移除 organizationId
   - `CreateEventData` 介面簡化

3. **元件功能**
   - `AnomalyLabelingSystem` - 完整的標記系統
   - `WorkbenchPage` - 高效標記工作台
   - `EventList` - 支援搜尋和篩選的事件列表
   - `TimeSeriesChart` - 時序圖表顯示
   - `DecisionPanel` - 審核決策面板

## 🔧 API 端點說明

### 異常事件 API
```
GET    /api/case-study/events          # 獲取事件列表
GET    /api/case-study/events/{id}     # 獲取事件詳情
PUT    /api/case-study/events/{id}/review  # 審核事件
DELETE /api/case-study/events/{id}     # 刪除事件
```

### 統計 API
```
GET    /api/case-study/stats           # 獲取統計資料
```

### 標籤 API
```
GET    /api/case-study/labels          # 獲取標籤列表
POST   /api/case-study/labels          # 創建標籤
PUT    /api/case-study/labels/{id}     # 更新標籤
DELETE /api/case-study/labels/{id}     # 刪除標籤
```

## 🎯 核心功能

### 1. 異常事件標記系統
- **總覽模式**：查看所有事件的完整列表和統計
- **工作台模式**：專注於待標記事件的高效處理

### 2. 事件篩選和搜尋
- 狀態篩選：`UNREVIEWED`、`CONFIRMED_POSITIVE`、`REJECTED_NORMAL`
- 電錶ID篩選
- 關鍵字搜尋（事件ID、電錶ID、檢測規則）
- 日期範圍篩選

### 3. 時序圖表分析
- 使用 Plotly.js 顯示能耗數據
- 標記異常事件發生時間點
- 顯示事件前後的資料窗口

### 4. 審核決策
- 確認為異常事件（CONFIRMED_POSITIVE）
- 駁回為正常（REJECTED_NORMAL）
- 添加審核備註
- 自動記錄審核時間和審核者

## 🚨 故障排除

### 前端無法連接後端
1. 確認後端已在 `localhost:8000` 啟動
2. 檢查瀏覽器控制台是否有 CORS 錯誤
3. 使用 `test-api-connection.html` 測試 API 連接

### 資料不顯示
1. 檢查後端日誌是否有錯誤
2. 確認模擬服務正常工作
3. 檢查前端網絡請求是否成功

### 圖表不顯示
1. 確認事件有 `dataWindow` 資料
2. 檢查 Plotly.js 是否正確載入
3. 查看瀏覽器控制台錯誤

## 📊 測試資料

模擬服務包含：
- **100 個異常事件**
- **60 個待審核事件**（UNREVIEWED）
- **25 個已確認異常**（CONFIRMED_POSITIVE）
- **15 個已駁回正常**（REJECTED_NORMAL）
- **20 個不同的電錶**（meter_100 到 meter_119）
- **6 種檢測規則**（Z-score、Sudden spike 等）

## 🔄 開發流程

1. **修改後端**：編輯 `backend/routes/casestudy.py`
2. **修改前端**：編輯 `apps/pu/src/hooks/use-case-study-data.ts`
3. **測試 API**：使用 `test-api-connection.html`
4. **前端測試**：在瀏覽器中測試標記功能

## 📝 注意事項

- 目前使用模擬資料，所有標記操作不會持久化
- 前端已移除所有組織相關功能，適用於單一組織場景
- API 支援分頁但前端尚未完全實現無限滾動
- 時序圖表使用固定的模擬資料窗口

根據您的報告書要求，系統已實現了主要的 P0 功能，包括：
- ✅ 真實 API 端點
- ✅ 分頁和篩選
- ✅ 載入狀態和空狀態
- ✅ 時序圖表和決策面板
- ✅ 即時狀態更新
