#!/usr/bin/env python3
"""
資料庫遷移腳本 - 更新 AmmeterLog 表結構
"""

import asyncio
import sys
import os

# 添加當前目錄到 Python 路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base

async def migrate_database():
    """遷移資料庫結構"""
    print("=== 開始資料庫遷移 ===")
    
    try:
        # 刪除所有表
        print("1. 刪除現有表...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        print("   ✓ 所有表已刪除")
        
        # 重新建立表
        print("2. 建立新表...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("   ✓ 新表已建立")
        
        print("\n=== 資料庫遷移完成 ===")
        print("注意：所有資料已被清除，需要重新同步電表資料")
        
    except Exception as e:
        print(f"遷移失敗: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # 確認操作
    print("警告：此操作將刪除所有現有資料！")
    confirm = input("確定要繼續嗎？(輸入 'yes' 確認): ")
    
    if confirm.lower() == 'yes':
        asyncio.run(migrate_database())
    else:
        print("操作已取消") 
