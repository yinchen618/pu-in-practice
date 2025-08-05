#!/usr/bin/env python3
"""
測試風格轉換 API 的參數傳遞
"""

import requests
import json
import base64
import time

def test_style_transfer_api():
    """測試風格轉換 API"""
    
    # API 端點
    url = "http://localhost:8000/api/style-transfer"
    
    # 創建一個簡單的測試圖片（base64 編碼的簡單 SVG）
    test_svg = '''
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="blue"/>
        <circle cx="50" cy="50" r="30" fill="red"/>
    </svg>
    '''
    test_image_base64 = base64.b64encode(test_svg.encode('utf-8')).decode('utf-8')
    
    # 測試不同的風格
    styles_to_test = ["vangogh", "ukiyo-e", "pixar", "watercolor", "oil_painting"]
    
    print("🧪 測試風格轉換 API 參數傳遞")
    print("="*60)
    
    for i, style in enumerate(styles_to_test, 1):
        print(f"\n📸 測試 {i}/{len(styles_to_test)}: {style}")
        print("-" * 40)
        
        # 構建請求數據
        payload = {
            "image_data": test_image_base64,
            "style": style
        }
        
        try:
            # 發送請求
            start_time = time.time()
            response = requests.post(url, json=payload, timeout=10)
            elapsed_time = time.time() - start_time
            
            print(f"⏱️  響應時間: {elapsed_time:.2f} 秒")
            print(f"📊 狀態碼: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ 成功!")
                print(f"🎨 返回風格: {result.get('style', 'N/A')}")
                print(f"📝 風格描述: {result.get('style_description', 'N/A')}")
                print(f"⏱️  處理時間: {result.get('processing_time', 'N/A')} 秒")
                print(f"📈 成功率: {result.get('success_rate', 'N/A')}")
                
                # 檢查返回的圖片數據是否包含風格信息
                result_image = result.get('result_image', '')
                if style in result_image:
                    print(f"✅ 返回圖片包含風格標識: {style}")
                else:
                    print(f"⚠️  返回圖片不包含風格標識")
                    
            else:
                print(f"❌ 失敗: {response.status_code}")
                print(f"錯誤信息: {response.text}")
                
        except Exception as e:
            print(f"❌ 異常: {e}")
        
        # 等待一下再測試下一個
        time.sleep(1)
    
    print("\n" + "="*60)
    print("🎯 測試完成!")

if __name__ == "__main__":
    test_style_transfer_api() 
