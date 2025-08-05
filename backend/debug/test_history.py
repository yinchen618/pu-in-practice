#!/usr/bin/env python3
"""
測試電表歷史資料功能
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# 添加當前目錄到 Python 路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db_manager

async def test_ammeter_history():
    """測試電表歷史資料功能"""
    print("=== 測試電表歷史資料功能 ===")
    
    # 測試設備編號（請替換為實際的設備編號）
    test_device = "402A8FB02535"
    
    try:
        # 1. 測試獲取歷史資料
        print(f"\n1. 獲取電表 {test_device} 的歷史資料...")
        history = await db_manager.get_ammeter_history(test_device, limit=10)
        print(f"   找到 {len(history)} 筆歷史記錄")
        
        if history:
            print("   最新的記錄:")
            latest = history[0]
            print(f"   - 時間: {latest.createdAt}")
            print(f"   - 電壓: {latest.voltage}V")
            print(f"   - 電流: {latest.currents}A")
            print(f"   - 功率: {latest.power}W")
            print(f"   - 累計用電: {latest.battery}kWh")
            print(f"   - 開關狀態: {'開啟' if latest.switchState == 1 else '關閉'}")
            print(f"   - 網路狀態: {'正常' if latest.networkState == 1 else '斷網'}")
        
        # 2. 測試統計資料
        print(f"\n2. 獲取電表 {test_device} 的統計資料（最近7天）...")
        stats = await db_manager.get_ammeter_statistics(test_device, days=7)
        print(f"   統計結果:")
        print(f"   - 總記錄數: {stats['totalRecords']}")
        print(f"   - 平均電壓: {stats['averageVoltage']:.1f}V")
        print(f"   - 平均電流: {stats['averageCurrent']:.1f}A")
        print(f"   - 平均功率: {stats['averagePower']:.1f}W")
        print(f"   - 總用電量: {stats['totalBattery']:.2f}kWh")
        print(f"   - 線上率: {stats['onlineRate']*100:.1f}%")
        print(f"   - 使用率: {stats['activeRate']*100:.1f}%")
        
        # 3. 測試指定日期範圍的歷史資料
        print(f"\n3. 獲取指定日期範圍的歷史資料...")
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=3)
        
        range_history = await db_manager.get_ammeter_history(
            test_device, 
            start_date=start_date, 
            end_date=end_date, 
            limit=50
        )
        print(f"   在 {start_date.strftime('%Y-%m-%d')} 到 {end_date.strftime('%Y-%m-%d')} 期間找到 {len(range_history)} 筆記錄")
        
        # 4. 測試所有電表的日誌
        print(f"\n4. 獲取所有電表日誌...")
        all_logs = await db_manager.get_ammeter_logs(limit=5)
        print(f"   找到 {len(all_logs)} 筆日誌記錄")
        
        for i, log in enumerate(all_logs[:3]):
            print(f"   日誌 {i+1}:")
            print(f"   - 設備: {log.deviceNumber}")
            print(f"   - 動作: {log.action}")
            print(f"   - 成功: {log.success}")
            print(f"   - 時間: {log.createdAt}")
            if log.voltage is not None:
                print(f"   - 電壓: {log.voltage}V")
        
        print("\n=== 測試完成 ===")
        
    except Exception as e:
        print(f"測試失敗: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ammeter_history()) 
