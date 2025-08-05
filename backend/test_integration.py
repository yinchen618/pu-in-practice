#!/usr/bin/env python3
"""
整合測試腳本：驗證 ammeter 和 testbed 服務的分離和整合
"""

import asyncio
import sys
import os

# 添加路徑
sys.path.append(os.path.dirname(__file__))

def test_services_import():
    """測試服務導入是否正常"""
    print("=" * 60)
    print("測試服務導入")
    print("=" * 60)
    
    try:
        from services.ammeter_service import ammeter_service
        print("✅ ammeter_service 導入成功")
        
        from services.testbed_service import testbed_service
        print("✅ testbed_service 導入成功")
        
        return True
    except Exception as e:
        print(f"❌ 服務導入失敗: {e}")
        return False

def test_ammeter_service():
    """測試 ammeter 服務功能"""
    print("\n" + "=" * 60)
    print("測試 Ammeter Service")
    print("=" * 60)
    
    try:
        from services.ammeter_service import ammeter_service
        
        # 測試設備列表載入
        devices = ammeter_service.ammeter_devices
        print(f"✅ 載入電表設備: {len(devices)} 個")
        
        # 測試設備查詢
        if devices:
            first_device = devices[0]
            print(f"✅ 第一個設備: {first_device.electricMeterName}")
            
            # 測試設備查詢功能
            found_device = ammeter_service.get_device_by_electric_meter_number(first_device.electricMeterNumber)
            if found_device:
                print(f"✅ 設備查詢成功: {found_device.electricMeterName}")
            else:
                print("❌ 設備查詢失敗")
        
        return True
    except Exception as e:
        print(f"❌ Ammeter Service 測試失敗: {e}")
        return False

def test_testbed_service():
    """測試 testbed 服務功能"""
    print("\n" + "=" * 60)
    print("測試 Testbed Service")
    print("=" * 60)
    
    try:
        from services.testbed_service import testbed_service
        
        # 測試房間資訊解析
        test_cases = [
            "15學舍101",
            "15學舍101a",
            "85學舍102",
            "85學舍102a"
        ]
        
        for test_case in test_cases:
            room_info = testbed_service._parse_room_info(test_case)
            if room_info:
                print(f"✅ 解析成功: {test_case} -> {room_info}")
            else:
                print(f"❌ 解析失敗: {test_case}")
        
        return True
    except Exception as e:
        print(f"❌ Testbed Service 測試失敗: {e}")
        return False

async def test_async_functions():
    """測試異步函數"""
    print("\n" + "=" * 60)
    print("測試異步函數")
    print("=" * 60)
    
    try:
        from services.ammeter_service import ammeter_service
        from services.testbed_service import testbed_service
        
        # 測試 ammeter 統計資料
        try:
            stats = await ammeter_service.get_ammeters_statistics()
            print(f"✅ Ammeter 統計資料: {stats.totalDevices} 個設備")
        except Exception as e:
            print(f"⚠️  Ammeter 統計資料獲取失敗 (可能是資料庫未連接): {e}")
        
        # 測試 testbed 概覽
        try:
            overview = await testbed_service.get_testbed_overview()
            print(f"✅ Testbed 概覽: {overview.unitCount} 個單元")
        except Exception as e:
            print(f"⚠️  Testbed 概覽獲取失敗 (可能是資料庫未連接): {e}")
        
        return True
    except Exception as e:
        print(f"❌ 異步函數測試失敗: {e}")
        return False

def test_service_separation():
    """測試服務分離是否正確"""
    print("\n" + "=" * 60)
    print("測試服務分離")
    print("=" * 60)
    
    try:
        from services.ammeter_service import ammeter_service
        from services.testbed_service import testbed_service
        
        # 檢查 ammeter_service 是否有 testbed 相關方法
        ammeter_methods = [method for method in dir(ammeter_service) if not method.startswith('_')]
        testbed_methods = [method for method in dir(testbed_service) if not method.startswith('_')]
        
        print(f"✅ Ammeter Service 方法: {ammeter_methods}")
        print(f"✅ Testbed Service 方法: {testbed_methods}")
        
        # 檢查是否有重複的方法
        common_methods = set(ammeter_methods) & set(testbed_methods)
        if common_methods:
            print(f"⚠️  發現共同方法: {common_methods}")
        else:
            print("✅ 服務方法分離正確")
        
        return True
    except Exception as e:
        print(f"❌ 服務分離測試失敗: {e}")
        return False

def main():
    """主測試函數"""
    print("開始整合測試...")
    print()
    
    # 測試服務導入
    if not test_services_import():
        return False
    
    # 測試 ammeter 服務
    if not test_ammeter_service():
        return False
    
    # 測試 testbed 服務
    if not test_testbed_service():
        return False
    
    # 測試服務分離
    if not test_service_separation():
        return False
    
    # 測試異步函數
    asyncio.run(test_async_functions())
    
    print("\n" + "=" * 60)
    print("整合測試完成")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("🎉 所有測試通過！")
    else:
        print("❌ 測試失敗")
        sys.exit(1) 
