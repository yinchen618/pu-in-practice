import asyncio
import csv
import os
from datetime import datetime
from typing import List, Dict
from database import db_manager

# ========== 電表資料載入 ==========
def load_meter_data() -> List[Dict[str, str]]:
    """從 CSV 檔案載入電表資料"""
    meters = []
    csv_path = os.path.join(os.path.dirname(__file__), "meter.csv")
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                meters.append({
                    "electricMeterNumber": row["电表号"],
                    "electricMeterName": row["电表名称"],
                    "deviceNumber": row["设备编号"]
                })
        
        print(f"成功載入 {len(meters)} 個電表資料")
        return meters
        
    except Exception as e:
        print(f"載入電表資料失敗: {e}")
        return []

# ========== Cron 任務 ==========
async def fetch_all_meters_data():
    """抓取所有電表資料並儲存到資料庫"""
    start_time = datetime.now()
    print(f"\n=== 開始執行電表資料抓取任務 ({start_time.strftime('%Y-%m-%d %H:%M:%S')}) ===")
    
    # 載入電表清單
    meters = load_meter_data()
    if not meters:
        print("沒有電表資料可處理")
        return
    
    # 並行抓取所有電表資料
    async def fetch_single_meter(meter: Dict[str, str]):
        try:
            device_number = meter["deviceNumber"]
            
            # 使用 ammeters_api 的函數來抓取資料
            # 注意：get_ammeter_detail 函數內部已經會儲存資料到 Ammeter 表
            from ammeters_api import get_ammeter_detail
            
            ammeter_response = await get_ammeter_detail(device_number)
            
            # 不需要再次儲存，因為 get_ammeter_detail 內部已經儲存了
            # 只需要更新電表名稱和編號（如果需要的話）
            try:
                # 更新電表的基本資訊（名稱和編號）
                update_data = {
                    "electricMeterNumber": meter["electricMeterNumber"],
                    "electricMeterName": meter["electricMeterName"],
                    "deviceNumber": device_number,
                    "lastUpdated": datetime.utcnow()
                }
                await db_manager.save_ammeter_data(update_data)
            except Exception as update_error:
                print(f"更新電表基本資訊失敗 {device_number}: {update_error}")
            
            return {"success": True, "device": device_number, "name": meter['electricMeterName']}
            
        except Exception as e:
            return {"success": False, "device": meter.get('deviceNumber', 'unknown'), "name": meter.get('electricMeterName', 'unknown'), "error": str(e)}
    
    # 並行執行所有電表資料抓取
    tasks = [fetch_single_meter(meter) for meter in meters]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # 統計結果
    success_results = [r for r in results if isinstance(r, dict) and r.get("success")]
    failed_results = [r for r in results if isinstance(r, dict) and not r.get("success")]
    exception_results = [r for r in results if not isinstance(r, dict)]
    
    success_count = len(success_results)
    failed_count = len(failed_results) + len(exception_results)
    total_count = len(meters)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # 統整輸出結果
    print(f"=== 電表資料抓取完成 ({end_time.strftime('%Y-%m-%d %H:%M:%S')}) ===")
    print(f"執行時間: {duration:.1f} 秒")
    print(f"總計: {total_count} 個電表")
    print(f"成功: {success_count} 個")
    print(f"失敗: {failed_count} 個")
    
    # 顯示失敗的電表詳情
    if failed_results:
        print(f"\n失敗的電表:")
        for result in failed_results:
            print(f"  - {result['name']} ({result['device']}): {result['error']}")
    
    if exception_results:
        print(f"\n異常錯誤:")
        for i, exception in enumerate(exception_results):
            print(f"  - 異常 {i+1}: {str(exception)}")
    
    print()

async def cron_task():
    """每分鐘執行的 cron 任務"""
    while True:
        try:
            await fetch_all_meters_data()
        except Exception as e:
            print(f"Cron 任務執行失敗: {e}")
        
        # 等待 600 秒（10分鐘）
        await asyncio.sleep(60)

# ========== 啟動函數 ==========
async def start_cron():
    """啟動電表資料抓取 cron 任務"""
    print("啟動電表資料抓取 cron 任務...")
    await cron_task()

# ========== 手動執行函數 ==========
async def manual_fetch():
    """手動執行一次電表資料抓取"""
    try:
        await fetch_all_meters_data()
        return {"success": True, "message": "電表資料抓取完成"}
    except Exception as e:
        return {"success": False, "message": f"電表資料抓取失敗: {str(e)}"}

if __name__ == "__main__":
    # 如果直接執行此檔案，則啟動 cron 任務
    asyncio.run(start_cron()) 
