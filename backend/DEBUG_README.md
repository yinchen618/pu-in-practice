# Ammeter History API 除錯指南

## 問題描述

前端發送請求到 `/api/testbed/ammeter-history` 時遇到 422 Unprocessable Entity 錯誤。

### 錯誤請求
```
GET /api/testbed/ammeter-history?building=a&meter_number=102&start_date=2025-07-27&end_date=2025-08-03
```

## 問題根源

前端發送的參數名稱與後端期望的參數名稱不匹配：
- **前端發送**: `building=a`, `meter_number=102`
- **後端期望**: `electric_meter_number=15學舍102`

## 解決方案

### 1. 後端修復 (已實施)

修改 `backend/routes/testbed.py` 中的 `/ammeter-history` 端點，支援多種參數格式：

```python
@router.get("/ammeter-history")
async def get_ammeter_historical_data(
    building: Optional[str] = Query(None),
    meter_number: Optional[str] = Query(None),
    electric_meter_number: Optional[str] = Query(None),
    start_date: str = Query(...),
    end_date: str = Query(...)
):
    # 處理不同的參數格式
    if electric_meter_number:
        target_meter_number = electric_meter_number
    elif building and meter_number:
        building_prefix = "15學舍" if building == "a" else "85學舍"
        target_meter_number = f"{building_prefix}{meter_number}"
    else:
        raise HTTPException(status_code=422, detail="參數錯誤")
```

### 2. 參數轉換邏輯

- `building=a` + `meter_number=102` → `electric_meter_number=15學舍102`
- `building=b` + `meter_number=102` → `electric_meter_number=85學舍102`

## 除錯工具

### 1. 完整除錯腳本
```bash
python debug_ammeter_api.py
```

**功能**:
- 測試所有相關的 API 端點
- 驗證參數處理邏輯
- 檢查 meter.csv 檔案解析
- 提供詳細的錯誤資訊

### 2. 快速測試腳本
```bash
python quick_test_fix.py
```

**功能**:
- 快速驗證修復是否生效
- 測試不同的參數格式
- 提供即時反饋

### 3. 除錯日誌
查看 `debug_ammeter_422_error.log` 檔案獲取詳細的錯誤分析。

## 測試案例

### 測試案例 1: 原始請求 (修復前會失敗)
```
GET /api/testbed/ammeter-history?building=a&meter_number=102&start_date=2025-07-27&end_date=2025-08-03
```

### 測試案例 2: 修正後的請求 (應該成功)
```
GET /api/testbed/ammeter-history?electric_meter_number=15學舍102&start_date=2025-07-27&end_date=2025-08-03
```

### 測試案例 3: 新支援的格式 (修復後應該成功)
```
GET /api/testbed/ammeter-history?building=a&meter_number=102&start_date=2025-07-27&end_date=2025-08-03
```

## 電表號碼對應關係

根據 `meter.csv` 檔案：

### Building A (15學舍)
- 房間 102: `15學舍102` (電表號: 919700049)
- 房間 102a: `15學舍102a` (電表號: 919700089)

### Building B (85學舍)
- 房間 102: `85學舍102` (電表號: 919700045)

## 除錯步驟

1. **啟動後端服務**
   ```bash
   cd backend
   python main.py
   ```

2. **運行除錯腳本**
   ```bash
   python debug_ammeter_api.py
   ```

3. **檢查輸出**
   - 確認 API 端點可用性
   - 驗證參數處理邏輯
   - 檢查電表號碼對應關係

4. **運行快速測試**
   ```bash
   python quick_test_fix.py
   ```

5. **檢查日誌**
   - 查看 `debug_ammeter_422_error.log`
   - 檢查後端控制台輸出

## 相關檔案

- `backend/routes/testbed.py` - API 路由定義
- `backend/services/testbed_service.py` - 業務邏輯
- `backend/meter.csv` - 電表對應資料
- `backend/debug_ammeter_api.py` - 完整除錯腳本
- `backend/quick_test_fix.py` - 快速測試腳本
- `backend/debug_ammeter_422_error.log` - 除錯日誌

## 注意事項

1. 確保後端服務正在運行
2. 檢查 meter.csv 檔案是否存在且格式正確
3. 驗證資料庫連接是否正常
4. 確認 API 端點路徑正確

## 常見問題

### Q: 仍然收到 422 錯誤？
A: 檢查後端服務是否已重新啟動，新的路由修改需要重啟服務才能生效。

### Q: 電表號碼找不到？
A: 檢查 meter.csv 檔案中的電表名稱是否與請求中的格式匹配。

### Q: 資料庫查詢失敗？
A: 檢查資料庫連接和 testbed_service.py 中的查詢邏輯。 
