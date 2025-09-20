/**
 * 測試 API 日誌過濾效果
 * 在瀏覽器控制台運行此腳本來驗證日誌過濾是否生效
 */

console.log('🧪 測試 API 日誌過濾效果...')

// 導入日誌器
import { apiLogger, logger } from './logger'

function testApiLogFiltering() {
  console.log('\n=== 開始測試 API 日誌過濾 ===')

  // 測試各種日誌類型
  console.log('\n1. 測試 API Request 日誌 (應該被過濾):')
  apiLogger.request('https://weakrisk.yinchen.tw/api/test', 'GET', {
    test: true,
  })

  console.log('\n2. 測試 API Response 日誌 (應該被過濾):')
  apiLogger.response('https://weakrisk.yinchen.tw/api/test', 200, {
    result: 'success',
  })

  console.log('\n3. 測試 API Cached 日誌 (應該被過濾):')
  apiLogger.cached('https://weakrisk.yinchen.tw/api/test', { fromCache: true })

  console.log('\n4. 測試 API Error 日誌 (應該顯示):')
  apiLogger.error('https://weakrisk.yinchen.tw/api/test', new Error('Test error'))

  console.log('\n5. 測試一般 debug 日誌 (應該顯示):')
  logger.debug('這是一般的 debug 訊息', { data: 'test' }, 'Component')

  console.log('\n6. 測試 info 日誌 (非 API，應該被過濾):')
  logger.info('這是一般的 info 訊息', { data: 'test' }, 'Component')

  console.log('\n7. 測試 warn 日誌 (應該顯示):')
  logger.warn('這是警告訊息', { data: 'test' }, 'Component')

  console.log('\n8. 測試 error 日誌 (應該顯示):')
  logger.error('這是錯誤訊息', { data: 'test' }, 'Component')

  console.log('\n=== 測試完成 ===')
  console.log('預期結果：只應該看到 error、warn 和非 API 的 debug 日誌')
}

// 檢查日誌記錄情況
function checkLogHistory() {
  console.log('\n=== 檢查日誌歷史記錄 ===')
  const logs = logger.getLogs()
  const recentLogs = logs.slice(-10) // 最近 10 條

  console.log(`總日誌數量: ${logs.length}`)
  console.log('最近的日誌記錄:')
  recentLogs.forEach((log, index) => {
    console.log(`${index + 1}. [${log.level}] ${log.source || 'unknown'}: ${log.message}`)
  })

  // 統計各類型日誌
  const stats = {
    api: logs.filter(log => log.source === 'API').length,
    apiCache: logs.filter(log => log.source === 'API-Cache').length,
    error: logs.filter(log => log.level === 'error').length,
    warn: logs.filter(log => log.level === 'warn').length,
    info: logs.filter(log => log.level === 'info').length,
    debug: logs.filter(log => log.level === 'debug').length,
  }

  console.log('\n日誌統計:')
  Object.entries(stats).forEach(([type, count]) => {
    console.log(`${type}: ${count} 條`)
  })
}

// 如果在瀏覽器環境中，暴露測試函數到全局
if (typeof window !== 'undefined') {
  ;(window as any).testApiLogFiltering = testApiLogFiltering
  ;(window as any).checkLogHistory = checkLogHistory

  console.log('🔧 API 日誌過濾測試工具已載入')
  console.log('💡 運行測試: testApiLogFiltering()')
  console.log('💡 檢查記錄: checkLogHistory()')
}

export { testApiLogFiltering, checkLogHistory }
