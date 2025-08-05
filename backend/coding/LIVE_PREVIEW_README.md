# Live Preview 功能說明

## 概述

Live Preview 是一個新的功能，讓你可以透過 HTTP 伺服器直接存取 `temp_workspaces` 目錄中的檔案，實現真正的即時預覽。

## 功能特色

### 🚀 直接檔案存取
- 透過 `http://localhost:8000/live-preview/{sessionId}/檔案路徑` 直接存取檔案
- 支援所有常見的網頁檔案類型
- 無需額外的檔案轉換或處理

### 📁 支援的檔案類型
- **HTML 檔案**: `.html`, `.htm`
- **CSS 樣式表**: `.css`
- **JavaScript 檔案**: `.js`
- **圖片檔案**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`
- **字體檔案**: `.woff`, `.woff2`, `.ttf`
- **多媒體檔案**: `.mp4`, `.webm`, `.mp3`, `.wav`
- **其他檔案**: `.json`, `.xml`, `.txt`, `.ico`

### 🔒 安全性保障
- 路徑遍歷攻擊防護
- 只能存取指定 session 目錄內的檔案
- 完整的錯誤處理和日誌記錄

## 使用方法

### 1. 基本用法

```bash
# 存取 HTML 檔案
http://localhost:8000/live-preview/{sessionId}/index.html

# 存取圖片檔案
http://localhost:8000/live-preview/{sessionId}/images/logo.png

# 存取 CSS 檔案
http://localhost:8000/live-preview/{sessionId}/styles/main.css
```

### 2. 前端整合

在前端應用中，你可以這樣使用：

```javascript
// 獲取 session ID
const sessionId = sessionStorage.getItem("workspace_session_id");

// 構建檔案 URL
const fileUrl = `http://localhost:8000/live-preview/${sessionId}/${encodeURIComponent(filePath)}`;

// 在 iframe 中預覽 HTML
<iframe src={fileUrl} />

// 在 img 標籤中顯示圖片
<img src={fileUrl} alt="Preview" />
```

### 3. 實際範例

假設你有一個 session ID 為 `abc123`，並且有以下檔案結構：

```
temp_workspaces/
└── abc123/
    ├── index.html
    ├── styles/
    │   └── main.css
    └── images/
        └── logo.png
```

你可以透過以下 URL 存取這些檔案：

- `http://localhost:8000/live-preview/abc123/index.html`
- `http://localhost:8000/live-preview/abc123/styles/main.css`
- `http://localhost:8000/live-preview/abc123/images/logo.png`

## 技術實現

### 後端路由

新的路由定義在 `backend/coding/main.py` 中：

```python
@app.get("/live-preview/{session_id}/{file_path:path}")
async def live_preview_static_files(session_id: str, file_path: str):
    """
    提供靜態檔案服務，讓 temp_workspaces 目錄可以透過 HTTP 直接存取
    """
    # 安全性檢查
    # 檔案類型判斷
    # 內容回傳
```

### 安全性檢查

1. **路徑遍歷防護**: 檢查 `..` 和絕對路徑
2. **目錄限制**: 確保只能存取指定 session 目錄
3. **檔案存在性檢查**: 驗證檔案是否存在

### 內容類型處理

根據檔案副檔名自動設定正確的 `Content-Type`：

```python
content_type_map = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    # ... 更多類型
}
```

## 測試

### 自動化測試

執行測試腳本來驗證功能：

```bash
cd backend/coding
python test_live_preview.py
```

### 手動測試

1. 啟動後端服務
2. 在瀏覽器中開啟測試 URL
3. 檢查檔案是否正確載入

## 與現有功能的整合

### 前端預覽功能

前端的即時預覽功能已經更新為使用新的 live-preview 路由：

```typescript
// 舊的方式（使用 srcDoc）
<iframe srcDoc={code} />

// 新的方式（直接存取檔案）
<iframe src={fileUrl} />
```

### 檔案執行功能

HTML 檔案的執行功能也已經更新：

```typescript
// 舊的方式
const fileUrl = `http://localhost:8000/coding/files/${sessionId}/serve?path=${encodeURIComponent(selectedFile)}`;

// 新的方式
const fileUrl = `http://localhost:8000/live-preview/${sessionId}/${encodeURIComponent(selectedFile)}`;
```

## 優勢

### 1. 真實檔案存取
- 直接存取檔案系統中的真實檔案
- 支援所有檔案類型和資源
- 無需額外的檔案轉換

### 2. 更好的性能
- 減少記憶體使用
- 更快的載入速度
- 更少的網路傳輸

### 3. 更完整的支援
- 支援外部資源引用
- 支援相對路徑
- 支援複雜的網頁應用

### 4. 更好的除錯體驗
- 可以直接在瀏覽器中查看檔案
- 支援開發者工具
- 更容易進行除錯

## 注意事項

1. **安全性**: 確保只存取允許的檔案路徑
2. **效能**: 大型檔案可能需要較長的載入時間
3. **快取**: 使用 `Cache-Control: no-cache` 確保即時更新
4. **錯誤處理**: 妥善處理檔案不存在等錯誤情況

## 未來改進

1. **快取機制**: 添加適當的快取策略
2. **壓縮**: 支援 gzip 壓縮
3. **範圍請求**: 支援 HTTP Range 請求
4. **監控**: 添加檔案存取監控和統計 
