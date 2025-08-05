import json
import httpx
import logging
import uuid
import os
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 設定日誌 ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('coding_backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# --- 全域設定 ---
# Ollama API 的預設位址
OLLAMA_API_URL = "http://localhost:11434/api/chat"

# 檔案與 Session 管理設定
BASE_WORKSPACE_DIR = Path(__file__).parent / "temp_workspaces"
BASE_WORKSPACE_DIR.mkdir(exist_ok=True)  # 確保根目錄存在

# --- FastAPI 應用程式實例 ---
app = FastAPI(
    title="AI Coding Assistant Backend (Ollama)",
    description="這個後端服務作為前端 AI 聊天室與本地 Ollama 服務之間的中介，並提供檔案管理功能。",
    version="2.0.0",
)

# 添加 CORS 中間件
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"  # 開發環境允許所有來源
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic 資料模型 ---
class CodeAssistantRequest(BaseModel):
    prompt: str  # 使用者在聊天室輸入的問題
    code_context: str = ""  # 當前編輯器中的程式碼內容

class FileWriteRequest(BaseModel):
    path: str       # 相對於 session 資料夾的檔案路徑
    content: str    # 新的檔案內容

class FileCreateRequest(BaseModel):
    path: str       # 檔案或資料夾路徑
    type: str       # "file" 或 "directory"

# --- 安全性檢查函式 ---
def get_safe_path(session_id: str, relative_path: str) -> Path:
    """防止路徑遍歷攻擊的安全檢查函式"""
    session_dir = BASE_WORKSPACE_DIR / session_id
    session_dir.mkdir(exist_ok=True)  # 確保 session 目錄存在
    
    # 處理相對路徑，確保安全性
    if relative_path.startswith('/') or '..' in relative_path:
        raise HTTPException(status_code=400, detail="Invalid path specified.")
    
    safe_path = session_dir / relative_path
    
    # 簡化的路徑檢查：確保路徑在 session 目錄內
    try:
        safe_path_abs = safe_path.resolve()
        session_dir_abs = session_dir.resolve()
        
        # 檢查路徑是否在 session 目錄內
        if not str(safe_path_abs).startswith(str(session_dir_abs)):
            raise HTTPException(status_code=400, detail="Invalid path specified.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Invalid path specified.")
    
    return safe_path

# --- API 路由器 ---
coding_router = APIRouter(
    prefix="/coding",
    tags=["AI Coding Assistant (Ollama)"]
)

session_router = APIRouter(
    prefix="/coding/session",
    tags=["Session Management"]
)

files_router = APIRouter(
    prefix="/coding/files",
    tags=["File System Operations"]
)

# --- Session 管理 API ---
@session_router.post("/init")
async def initialize_session():
    """
    建立一個新的使用者 Session，並返回唯一的 Session ID。
    後端會為此 Session 建立一個專屬的暫存資料夾。
    """
    session_id = str(uuid.uuid4())
    session_dir = BASE_WORKSPACE_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    
    logger.info(f"建立新的 Session: {session_id}")
    
    # 建立一些範例檔案
    try:
        (session_dir / "welcome.js").write_text(
            "// Welcome to your new workspace!\nconsole.log('Hello, World!');\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\ngreet('Developer');"
        )
        (session_dir / "styles.css").write_text(
            "/* Welcome to your CSS file */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  background: white;\n  padding: 20px;\n  border-radius: 8px;\n  box-shadow: 0 2px 10px rgba(0,0,0,0.1);\n}"
        )
        (session_dir / "index.html").write_text(
            '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Project</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n    <div class="container">\n        <h1>Welcome to Your Project!</h1>\n        <p>Start coding and building amazing things.</p>\n    </div>\n    <script src="welcome.js"></script>\n</body>\n</html>'
        )
        
        # 建立一個子資料夾作為範例
        (session_dir / "src").mkdir(exist_ok=True)
        (session_dir / "src" / "main.js").write_text(
            "// Main application file\nconsole.log('Application started');\n\n// Your main logic goes here"
        )
        
    except Exception as e:
        logger.warning(f"建立範例檔案時發生錯誤: {e}")
    
    return {"session_id": session_id}

# --- 檔案操作 API ---
@files_router.get("/{session_id}")
async def list_files(session_id: str):
    """列出指定 Session 中的所有檔案和資料夾"""
    session_dir = BASE_WORKSPACE_DIR / session_id
    if not session_dir.is_dir():
        raise HTTPException(status_code=404, detail="Session not found.")
    
    logger.info(f"列出 Session {session_id} 的檔案")
    
    file_structure = []
    try:
        for item in sorted(session_dir.rglob("*")):
            relative_path = str(item.relative_to(session_dir.resolve()))
            if relative_path != ".":  # 排除根目錄本身
                file_structure.append({
                    "path": relative_path,
                    "type": "directory" if item.is_dir() else "file",
                    "size": item.stat().st_size if item.is_file() else None,
                    "modified": datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                })
    except Exception as e:
        logger.error(f"列出檔案時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail="Failed to list files")
    
    return file_structure

@files_router.get("/{session_id}/content")
async def read_file_content(session_id: str, path: str):
    """讀取指定檔案的內容"""
    file_path = get_safe_path(session_id, path)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found.")
    
    logger.info(f"讀取檔案: {session_id}/{path}")
    
    try:
        # 檢查是否為圖片檔案
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'}
        file_extension = file_path.suffix.lower()
        
        if file_extension in image_extensions:
            # 對於圖片檔案，讀取為 base64
            import base64
            with open(file_path, "rb") as f:
                content = base64.b64encode(f.read()).decode('utf-8')
            return {
                "content": content, 
                "path": path, 
                "type": "image",
                "mime_type": f"image/{file_extension[1:] if file_extension != '.jpg' else 'jpeg'}"
            }
        else:
            # 對於文字檔案，讀取為文字
            content = file_path.read_text(encoding='utf-8')
            return {"content": content, "path": path, "type": "text"}
    except Exception as e:
        logger.error(f"讀取檔案時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail="Failed to read file")

@files_router.post("/{session_id}/content")
async def write_file_content(session_id: str, payload: FileWriteRequest):
    """儲存/寫入檔案內容"""
    file_path = get_safe_path(session_id, payload.path)
    
    # 確保父目錄存在
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"儲存檔案: {session_id}/{payload.path}")
    
    try:
        file_path.write_text(payload.content, encoding='utf-8')
        return {"message": f"File '{payload.path}' saved successfully.", "path": payload.path}
    except Exception as e:
        logger.error(f"儲存檔案時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to write file: {e}")

@files_router.post("/{session_id}/create")
async def create_file_or_directory(session_id: str, payload: FileCreateRequest):
    """建立新的檔案或資料夾"""
    target_path = get_safe_path(session_id, payload.path)
    
    # 確保父目錄存在
    target_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"建立 {payload.type}: {session_id}/{payload.path}")
    
    try:
        if payload.type == "directory":
            target_path.mkdir(exist_ok=True)
        elif payload.type == "file":
            target_path.touch()
        else:
            raise HTTPException(status_code=400, detail="Invalid type. Must be 'file' or 'directory'")
        
        return {"message": f"{payload.type.capitalize()} '{payload.path}' created successfully.", "path": payload.path}
    except Exception as e:
        logger.error(f"建立檔案/資料夾時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create {payload.type}: {e}")

@files_router.delete("/{session_id}")
async def delete_file_or_directory(session_id: str, path: str):
    """刪除檔案或資料夾"""
    target_path = get_safe_path(session_id, path)
    
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="File or directory not found.")
    
    logger.info(f"刪除: {session_id}/{path}")
    
    try:
        if target_path.is_file():
            target_path.unlink()
        else:
            import shutil
            shutil.rmtree(target_path)
        
        return {"message": f"'{path}' deleted successfully."}
    except Exception as e:
        logger.error(f"刪除時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete: {e}")

@files_router.post("/{session_id}/upload")
async def upload_file(session_id: str, file: UploadFile = File(...), path: str = Form(".")):
    """上傳檔案"""
    session_dir = BASE_WORKSPACE_DIR / session_id
    if not session_dir.is_dir():
        raise HTTPException(status_code=404, detail="Session not found.")
    
    # 確保目標路徑是安全的
    target_dir = get_safe_path(session_id, path)
    if not target_dir.is_dir():
        raise HTTPException(status_code=400, detail="Target path is not a directory.")
    
    # 建立檔案路徑
    file_path = target_dir / file.filename
    
    logger.info(f"上傳檔案: {session_id}/{path}/{file.filename}")
    
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "message": "File uploaded successfully", 
            "path": str(file_path.relative_to(session_dir.resolve())),
            "size": len(content)
        }
    except Exception as e:
        logger.error(f"上傳檔案時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")

@files_router.get("/{session_id}/serve")
async def serve_file(session_id: str, path: str):
    """提供檔案服務，用於 HTML 預覽"""
    file_path = get_safe_path(session_id, path)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found.")
    
    logger.info(f"提供檔案服務: {session_id}/{path}")
    
    try:
        # 根據檔案類型設定正確的 Content-Type
        file_extension = file_path.suffix.lower()
        content_type_map = {
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
        }
        
        content_type = content_type_map.get(file_extension, 'application/octet-stream')
        
        # 讀取檔案內容
        if file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot']:
            # 二進制檔案
            with open(file_path, "rb") as f:
                content = f.read()
        else:
            # 文字檔案
            content = file_path.read_text(encoding='utf-8').encode('utf-8')
        
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
    except Exception as e:
        logger.error(f"提供檔案服務時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve file")

# --- 核心 AI 聊天 API 端點 ---
@coding_router.post("/chat")
async def handle_code_chat(request: CodeAssistantRequest):
    """
    接收前端的程式碼與問題，向本地 Ollama 服務發起請求，並以串流方式回傳結果。
    """
    
    request_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    logger.info(f"[{request_id}] 收到聊天請求 - 提示: {request.prompt[:50]}...")
    logger.info(f"[{request_id}] 程式碼上下文長度: {len(request.code_context)} 字元")
    
    # 建立一個非同步的生成器函數，用於處理來自 Ollama 的串流響應
    async def stream_generator():
        try:
            # 使用 httpx.AsyncClient 來發送非同步請求
            async with httpx.AsyncClient(timeout=None) as client:
                # 這是要傳送給 Ollama API 的 payload
                payload = {
                    "model": "deepseek-coder", 
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are an expert AI programming assistant. Your role is to help users write, debug, and optimize their code. 

Guidelines:
1. Provide clear, concise, and helpful responses
2. When providing code snippets, use appropriate markdown formatting with ```language blocks
3. Explain your reasoning and suggestions
4. Be patient and thorough in your explanations
5. If the user provides code context, analyze it carefully
6. Suggest improvements and best practices when appropriate
7. Respond in the same language as the user's question (Chinese or English)"""
                        },
                        {
                            "role": "user",
                            "content": f"""Here is my current code context:
```javascript
{request.code_context}
```

My question is: {request.prompt}"""
                        }
                    ],
                    "stream": True  # 啟用串流模式
                }
                
                logger.info(f"[{request_id}] 向 Ollama API 發送請求...")
                
                # 使用 client.stream 向本地 Ollama 服務發起 POST 請求
                async with client.stream("POST", OLLAMA_API_URL, json=payload) as response:
                    # 檢查 Ollama API 的響應狀態碼
                    if response.status_code != 200:
                        error_content = await response.aread()
                        error_msg = f"Error from Ollama API: {error_content.decode()}"
                        logger.error(f"[{request_id}] {error_msg}")
                        yield f"data: {json.dumps({'error': error_msg})}\n\n"
                        return
                    
                    logger.info(f"[{request_id}] 開始串流回應...")
                    
                    # 逐行讀取 Ollama 的串流回應
                    async for line in response.aiter_lines():
                        if line.strip():  # 跳過空行
                            try:
                                logger.info(f"[{request_id}] 收到 Ollama 行: {line[:100]}...")
                                # 解析 JSON 回應
                                data = json.loads(line)
                                
                                # 處理 Ollama 格式的回應
                                if "message" in data and "content" in data["message"]:
                                    content = data["message"]["content"]
                                    if content:
                                        logger.info(f"[{request_id}] 發送內容: {content}")
                                        # 發送內容到前端
                                        yield f"data: {json.dumps({'content': content})}\n\n"
                                
                                # 檢查是否完成
                                if data.get("done", False):
                                    logger.info(f"[{request_id}] 串流完成")
                                    yield f"data: {json.dumps({'done': True})}\n\n"
                                    break
                                        
                            except json.JSONDecodeError as e:
                                logger.warning(f"[{request_id}] JSON 解析錯誤: {e}, 原始行: {line}")
                                continue
                            except Exception as e:
                                logger.error(f"[{request_id}] 處理串流回應時發生錯誤: {e}")
                                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                                break
                                
        except Exception as e:
            error_msg = f"Stream generation error: {str(e)}"
            logger.error(f"[{request_id}] {error_msg}")
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
    
    # 回傳串流回應
    return StreamingResponse(
        stream_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# --- 新增：Live Preview 靜態檔案服務路由器 ---
live_preview_router = APIRouter(
    prefix="/live-preview",
    tags=["Live Preview"]
)

@live_preview_router.get("/{session_id}/{file_path:path}")
async def live_preview_static_files(session_id: str, file_path: str):
    """
    提供靜態檔案服務，讓 temp_workspaces 目錄可以透過 HTTP 直接存取
    例如：http://localhost:8000/live-preview/sessionId/index.html
    """
    try:
        # 安全性檢查：防止路徑遍歷攻擊
        if '..' in file_path or file_path.startswith('/'):
            raise HTTPException(status_code=400, detail="Invalid path")
        
        # 構建完整的檔案路徑
        full_path = BASE_WORKSPACE_DIR / session_id / file_path
        
        # 確保路徑在允許的目錄內
        session_dir = BASE_WORKSPACE_DIR / session_id
        if not str(full_path.resolve()).startswith(str(session_dir.resolve())):
            raise HTTPException(status_code=400, detail="Access denied")
        
        # 檢查檔案是否存在
        if not full_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        
        logger.info(f"Live Preview 提供檔案: {session_id}/{file_path}")
        
        # 根據檔案類型設定正確的 Content-Type
        file_extension = full_path.suffix.lower()
        content_type_map = {
            '.html': 'text/html',
            '.htm': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
        }
        
        content_type = content_type_map.get(file_extension, 'application/octet-stream')
        
        # 讀取檔案內容
        if file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav']:
            # 二進制檔案
            with open(full_path, "rb") as f:
                content = f.read()
        else:
            # 文字檔案
            content = full_path.read_text(encoding='utf-8').encode('utf-8')
        
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "no-cache",  # 確保即時更新
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Live Preview 提供檔案時發生錯誤: {e}")
        raise HTTPException(status_code=500, detail="Failed to serve file")

# --- 健康檢查端點 ---
@coding_router.get("/health")
async def health_check():
    """健康檢查端點"""
    return {"status": "healthy", "service": "AI Coding Assistant Backend"}

# 將所有路由器加入到主應用中
app.include_router(coding_router)
app.include_router(session_router)
app.include_router(files_router)
app.include_router(live_preview_router)

# --- 運行伺服器的主入口 ---
if __name__ == "__main__":
    import uvicorn
    logger.info("啟動後端伺服器，請先確認 Ollama 服務已在本地運行。")
    logger.info("在瀏覽器中開啟 http://localhost:8000/docs 查看 API 文件。")
    uvicorn.run(app, host="0.0.0.0", port=8000) 
