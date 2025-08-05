# 🚀 AI Coding Assistant 快速開始指南

## 前置需求

1. **安裝 Ollama**
   ```bash
   # 前往 https://ollama.ai/ 下載並安裝
   ```

2. **安裝 Python 依賴**
   ```bash
   pip install -r requirements.txt
   ```

## 快速啟動

### 方法 1：使用主 API（推薦）

Coding API 已整合到主 `main.py` 中，啟動主服務即可使用所有功能：

```bash
# 啟動主 API 服務（包含所有模組）
python main.py
```

這會啟動包含以下模組的完整服務：
- ✅ 電表數據管理
- ✅ AI 模型訓練與預測
- ✅ PU Learning 模擬引擎
- ✅ Testbed 測試環境
- ✅ **AI 程式碼助手**（新增）

### 方法 2：獨立啟動（僅 Coding API）

如果只需要 Coding API：

```bash
cd coding
python start_server.py
```

### 方法 3：一鍵啟動（包含 Ollama）

```bash
cd coding
./start_all.sh
```

## 測試

### 測試主 API 整合
```bash
cd coding
python test_main_api.py
```

### 測試獨立 Coding API
```bash
cd coding
python test_api.py
```

### 測試前端
1. 打開瀏覽器訪問 http://localhost:3000
2. 在程式碼編輯器中輸入一些程式碼
3. 在右側 AI 聊天室中提問

## API 端點

### 主 API 端點
- **根端點**: `GET /` - 顯示所有可用模組
- **API 文件**: `GET /docs` - Swagger UI 文件

### Coding API 端點
- **聊天端點**: `POST /coding/chat` - AI 程式碼助手對話
- **健康檢查**: `GET /coding/health` - Coding API 狀態檢查

### 其他 API 端點
- **電表管理**: `/api/ammeter`
- **AI 訓練**: `/api/ai`
- **PU Learning**: `/api/pu-learning`
- **Testbed**: `/api/testbed`

## 使用範例

### 在 AI 聊天室中提問：

1. **程式碼解釋**
   ```
   請解釋這段 JavaScript 程式碼的作用
   ```

2. **程式碼優化**
   ```
   這段程式碼可以如何優化？
   ```

3. **除錯協助**
   ```
   我的程式碼有錯誤，請幫我找出問題
   ```

4. **功能實現**
   ```
   請幫我實現一個排序函數
   ```

## 故障排除

### 常見問題

1. **Ollama 服務無法連接**
   ```bash
   # 檢查 Ollama 是否運行
   ollama list
   
   # 重新啟動 Ollama
   ollama run deepseek-coder
   ```

2. **主 API 服務無法啟動**
   ```bash
   # 檢查端口是否被佔用
   lsof -i :8000
   
   # 檢查 Python 依賴
   pip install -r requirements.txt
   ```

3. **前端無法連接後端**
   - 確認後端運行在 http://localhost:8000
   - 檢查瀏覽器控制台是否有 CORS 錯誤

4. **Coding API 無法訪問**
   ```bash
   # 檢查主 API 是否包含 coding 模組
   curl http://localhost:8000/
   
   # 檢查 coding 健康檢查
   curl http://localhost:8000/coding/health
   ```

### 日誌查看

- **主 API 日誌**: 在運行 `python main.py` 的終端中查看
- **Ollama 日誌**: 在運行 `ollama run` 的終端中查看
- **前端日誌**: 在瀏覽器開發者工具中查看

## 進階配置

### 修改 AI 模型
在主 `main.py` 中修改：
```python
"model": "deepseek-coder"  # 改為其他模型名稱
```

### 修改系統提示詞
在主 `main.py` 中修改 `system` 角色的 `content` 來調整 AI 行為。

### 修改端口
在主 `main.py` 中修改：
```python
uvicorn.run(app, host=args.host, port=args.port)  # 修改端口號
```

### 啟用 Cron 任務
```bash
python main.py --enable-cron
```

## 支援的程式語言

AI 助手支援多種程式語言的語法高亮和程式碼分析：
- JavaScript/TypeScript
- Python
- HTML/CSS
- JSON
- Markdown
- 等等

## 功能特色

- ✅ 即時程式碼語法高亮
- ✅ AI 程式碼助手對話
- ✅ 串流回應（即時顯示）
- ✅ 程式碼上下文感知
- ✅ 多語言支援
- ✅ 本地 AI 模型（無需 API Key）
- ✅ 響應式設計
- ✅ 整合到主 API 系統
- ✅ 統一的服務管理

## 開發工作流程

1. **啟動完整服務**
   ```bash
   python main.py
   ```

2. **開發前端**
   ```bash
   cd ../../apps/livecoding
   pnpm dev
   ```

3. **測試 API**
   ```bash
   cd backend/coding
   python test_main_api.py
   ```

4. **查看 API 文件**
   - 訪問 http://localhost:8000/docs
   - 包含所有模組的 API 文件 
