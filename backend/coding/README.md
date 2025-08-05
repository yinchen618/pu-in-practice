# AI Coding Assistant API

這是一個基於 FastAPI 和 Ollama 的 AI 程式碼助手後端服務，為前端提供程式碼相關的 AI 對話功能。

## 架構

```
前端 AI 聊天室 <-> FastAPI 後端 (localhost:8000) <-> Ollama 服務 (localhost:11434)
```

## 前置需求

### 1. 安裝 Ollama

請先安裝 Ollama：https://ollama.ai/

### 2. 下載並運行 deepseek-coder 模型

```bash
# 下載模型
ollama pull deepseek-coder

# 運行模型（這會啟動 Ollama 服務）
ollama run deepseek-coder
```

### 3. 安裝 Python 依賴

```bash
pip install -r ../requirements.txt
```

## 啟動服務

### 方法 1：使用啟動腳本

```bash
python start_server.py
```

### 方法 2：直接使用 uvicorn

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API 端點

### 健康檢查

```
GET /coding/health
```

### 聊天端點

```
POST /coding/chat
```

**請求格式：**
```json
{
  "prompt": "請解釋這段程式碼的作用",
  "code_context": "function hello() { console.log('Hello'); }"
}
```

**回應：**
- 串流文字回應 (text/plain)
- 即時顯示 AI 生成的內容

## 測試

運行測試腳本來驗證 API 是否正常工作：

```bash
python test_api.py
```

## API 文件

啟動服務後，可以在瀏覽器中訪問：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 前端整合

前端可以通過以下方式與 API 溝通：

```javascript
const response = await fetch('http://localhost:8000/coding/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/plain'
  },
  body: JSON.stringify({
    prompt: '請解釋這段程式碼',
    code_context: 'function example() { return true; }'
  })
});

// 處理串流回應
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value, { stream: true });
  console.log(chunk); // 即時顯示 AI 回應
}
```

## 故障排除

### 1. 無法連接到 Ollama 服務

確保 Ollama 正在運行：
```bash
ollama list
```

### 2. 模型未找到

確保已下載 deepseek-coder 模型：
```bash
ollama pull deepseek-coder
```

### 3. CORS 錯誤

如果前端出現 CORS 錯誤，請確認：
- 前端運行在 http://localhost:3000 或 http://localhost:3001
- 後端 CORS 設定正確

### 4. 串流回應中斷

如果串流回應突然中斷，可能是：
- Ollama 服務負載過重
- 網路連接問題
- 模型回應時間過長

## 開發

### 修改系統提示詞

在 `main.py` 中修改 `system` 角色的 `content` 來調整 AI 的行為。

### 添加新的模型

修改 `payload` 中的 `model` 欄位來使用不同的 Ollama 模型。

### 自定義回應格式

修改 `stream_generator` 函數來調整回應的處理邏輯。 
