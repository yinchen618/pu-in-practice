// 移除不再需要的 React hooks imports

// 定義類型接口
export interface TestbedOverview {
  unitCount: number
  activeUnits: number
  totalPower: number
  avgPower: number
  status: 'healthy' | 'warning' | 'error'
  lastUpdate: string
  dataQuality: {
    completeness: number
    accuracy: number
    freshness: number
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    message: string
    timestamp: string
  }>
}

export interface TestbedUnit {
  id: string
  name: string
  location: string
  status: 'active' | 'inactive' | 'maintenance'
  powerConsumption: number
  lastReading: string
  meterTypes: string[]
  coordinates: [number, number]
  electricMeterNumber?: string
  isAppliance?: boolean
}

export interface MeterData {
  timeSeries: Array<{
    timestamp: string
    power: number
    voltage: number
    current: number
  }>
  statistics: {
    totalDataPoints: number
    averagePower: number
    maxPower: number
    minPower: number
    powerFactor: number
  }
  events: {
    anomalies: Array<{
      timestamp: string
      power: number
      description: string
    }>
    highUsagePeriods: Array<{
      startTime: string
      endTime: string
      averagePower: number
    }>
  }
  applianceTimeSeries?: Array<{
    timestamp: string
    power: number
    voltage: number
    current: number
  }>
  applianceStatistics?: {
    totalDataPoints: number
    averagePower: number
    maxPower: number
    minPower: number
    powerFactor: number
  }
  meterType?: 'main' | 'appliance' | 'both'
}

export interface ResidentialUnitItem {
  id: string
  roomNumber: string
  building: string // Building A or Building B
  hasAppliance: boolean
}

// API 客戶端
class TestbedAPIClient {
  private baseUrl = 'https://weakrisk.yinchen.tw'

  // 移除 getTestbedOverview 方法，overview 資料現在由 hook 直接提供

  async getMeterData(
    unitId: string,
    meterType: string,
    startDate?: string,
    endDate?: string
  ): Promise<MeterData> {
    const params = new URLSearchParams({
      unit_id: unitId,
      meter_type: meterType,
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    })

    const response = await fetch(`${this.baseUrl}/api/testbed/meter-data?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch meter data: ${response.status}`)
    }

    // Python API 返回 {success: true, data: {...}} 格式
    const result = await response.json()
    if (result.success && result.data) {
      return result.data
    }
    throw new Error('Invalid API response format')
  }
}

// 移除 TestbedAPIClient 中的 overview API 調用
// 保留其他 API 方法供 ammeter 資料使用

const testbedAPI = new TestbedAPIClient()

export function useTestbedData() {
  // 使用寫死的概覽資料，不再需要 API 調用
  const overview: TestbedOverview = {
    unitCount: 92,
    activeUnits: 88,
    totalPower: 45.6,
    avgPower: 0.52,
    status: 'healthy',
    lastUpdate: new Date().toISOString(),
    dataQuality: {
      completeness: 94.5,
      accuracy: 98.2,
      freshness: 96.8,
    },
    alerts: [
      {
        id: 'alert-001',
        type: 'info',
        message: '系統運行正常',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-002',
        type: 'warning',
        message: 'Building B 301 號房電表離線超過 2 小時',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }

  return {
    // Overview data
    overview,
    overviewLoading: false, // 不再需要載入狀態
  }
}

// New function for date and time range parameters
const getAmmeterHistoryDataWithTime = async (
  electricMeterNumber: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string
): Promise<MeterData> => {
  // 將台灣時間轉換為 ISO 8601 格式，明確指定 +08:00 時區
  const startDateTime = `${startDate}T${startTime}:00+08:00`
  const endDateTime = `${endDate}T${endTime}:00+08:00`

  const params = new URLSearchParams({
    electric_meter_number: electricMeterNumber,
    start_datetime: startDateTime,
    end_datetime: endDateTime,
  })

  const response = await fetch(`https://weakrisk.yinchen.tw/api/testbed/ammeter-history?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ammeter history: ${response.status}`)
  }

  // Python API returns {success: true, data: {...}} format
  const result = await response.json()
  if (result.success && result.data) {
    return result.data
  }
  throw new Error('Invalid API response format')
}

// New API function for date and time range parameters
export const fetchMeterDataWithTime = async (
  unit: string,
  meterType: string,
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string
): Promise<MeterData> => {
  // Build meter name based on building and unit
  const mainMeterName = `${unit}`
  const applianceMeterName = `${unit}a`

  if (meterType === 'both') {
    const mainData = await getAmmeterHistoryDataWithTime(
      mainMeterName,
      startDate,
      endDate,
      startTime,
      endTime
    )
    let applianceData: MeterData | null = null
    try {
      applianceData = await getAmmeterHistoryDataWithTime(
        applianceMeterName,
        startDate,
        endDate,
        startTime,
        endTime
      )
    } catch {
      applianceData = null // Some rooms don't have appliance meters, ignore
    }

    return {
      ...mainData,
      ...(applianceData
        ? {
            applianceTimeSeries: applianceData.timeSeries,
            applianceStatistics: applianceData.statistics,
          }
        : {}),
      meterType: 'both' as const,
    }
  }

  const targetMeterName = meterType === 'appliance' ? applianceMeterName : mainMeterName
  const data = await getAmmeterHistoryDataWithTime(
    targetMeterName,
    startDate,
    endDate,
    startTime,
    endTime
  )
  return {
    ...data,
    meterType: meterType as 'main' | 'appliance',
  }
}

// 取得建築物的房間選項列表
export function getUnitOptionsForBuilding(building: string, floor?: string) {
  let allUnits: Array<{
    value: string
    label: string
    hasAppliance: boolean
    floor: string
  }>

  if (building === 'a') {
    // Building A units
    allUnits = [
      { value: '101', label: '101', hasAppliance: true, floor: '1' },
      { value: '102', label: '102', hasAppliance: true, floor: '1' },
      { value: '103', label: '103', hasAppliance: true, floor: '1' },
      { value: '105', label: '105', hasAppliance: true, floor: '1' },
      { value: '106', label: '106', hasAppliance: true, floor: '1' },
      { value: '107', label: '107', hasAppliance: true, floor: '1' },
      { value: '108', label: '108', hasAppliance: true, floor: '1' },
      { value: '110', label: '110', hasAppliance: true, floor: '1' },
      { value: '201', label: '201', hasAppliance: true, floor: '2' },
      { value: '202', label: '202', hasAppliance: true, floor: '2' },
      { value: '203', label: '203', hasAppliance: true, floor: '2' },
      { value: '205', label: '205', hasAppliance: true, floor: '2' },
      { value: '206', label: '206', hasAppliance: true, floor: '2' },
      { value: '207', label: '207', hasAppliance: true, floor: '2' },
      { value: '208', label: '208', hasAppliance: true, floor: '2' },
      { value: '209', label: '209', hasAppliance: true, floor: '2' },
      { value: '210', label: '210', hasAppliance: true, floor: '2' },
      { value: '211', label: '211', hasAppliance: true, floor: '2' },
      { value: '212', label: '212', hasAppliance: true, floor: '2' },
      { value: '216', label: '216', hasAppliance: true, floor: '2' },
      { value: '301', label: '301', hasAppliance: true, floor: '3' },
      { value: '302', label: '302', hasAppliance: true, floor: '3' },
      { value: '303', label: '303', hasAppliance: true, floor: '3' },
      { value: '305', label: '305', hasAppliance: true, floor: '3' },
      { value: '306', label: '306', hasAppliance: true, floor: '3' },
      { value: '307', label: '307', hasAppliance: true, floor: '3' },
      { value: '308', label: '308', hasAppliance: true, floor: '3' },
      { value: '309', label: '309', hasAppliance: true, floor: '3' },
      { value: '310', label: '310', hasAppliance: true, floor: '3' },
      { value: '311', label: '311', hasAppliance: true, floor: '3' },
      { value: '312', label: '312', hasAppliance: true, floor: '3' },
      { value: '316', label: '316', hasAppliance: true, floor: '3' },
      { value: '501', label: '501', hasAppliance: true, floor: '5' },
      { value: '502', label: '502', hasAppliance: true, floor: '5' },
      { value: '503', label: '503', hasAppliance: true, floor: '5' },
      { value: '505', label: '505', hasAppliance: true, floor: '5' },
      { value: '506', label: '506', hasAppliance: true, floor: '5' },
      { value: '507', label: '507', hasAppliance: true, floor: '5' },
      { value: '508', label: '508', hasAppliance: true, floor: '5' },
      { value: '509', label: '509', hasAppliance: true, floor: '5' },
      { value: '510', label: '510', hasAppliance: true, floor: '5' },
      { value: '511', label: '511', hasAppliance: true, floor: '5' },
      { value: '512', label: '512', hasAppliance: true, floor: '5' },
      { value: '516', label: '516', hasAppliance: true, floor: '5' },
    ]
  } else {
    // Building B units
    allUnits = [
      { value: '101', label: '101', hasAppliance: false, floor: '1' },
      { value: '102', label: '102', hasAppliance: true, floor: '1' },
      { value: '103', label: '103', hasAppliance: false, floor: '1' },
      { value: '105', label: '105', hasAppliance: true, floor: '1' },
      { value: '106', label: '106', hasAppliance: true, floor: '1' },
      { value: '107', label: '107', hasAppliance: true, floor: '1' },
      { value: '108', label: '108', hasAppliance: true, floor: '1' },
      { value: '109', label: '109', hasAppliance: true, floor: '1' },
      { value: '110', label: '110', hasAppliance: true, floor: '1' },
      { value: '111', label: '111', hasAppliance: true, floor: '1' },
      { value: '201', label: '201', hasAppliance: true, floor: '2' },
      { value: '202', label: '202', hasAppliance: true, floor: '2' },
      { value: '203', label: '203', hasAppliance: true, floor: '2' },
      { value: '205', label: '205', hasAppliance: true, floor: '2' },
      { value: '206', label: '206', hasAppliance: true, floor: '2' },
      { value: '207', label: '207', hasAppliance: true, floor: '2' },
      { value: '208', label: '208', hasAppliance: true, floor: '2' },
      { value: '209', label: '209', hasAppliance: true, floor: '2' },
      { value: '210', label: '210', hasAppliance: true, floor: '2' },
      { value: '211', label: '211', hasAppliance: true, floor: '2' },
      { value: '212', label: '212', hasAppliance: true, floor: '2' },
      { value: '301', label: '301', hasAppliance: true, floor: '3' },
      { value: '302', label: '302', hasAppliance: true, floor: '3' },
      { value: '303', label: '303', hasAppliance: false, floor: '3' },
      { value: '305', label: '305', hasAppliance: true, floor: '3' },
      { value: '306', label: '306', hasAppliance: true, floor: '3' },
      { value: '307', label: '307', hasAppliance: true, floor: '3' },
      { value: '308', label: '308', hasAppliance: true, floor: '3' },
      { value: '309', label: '309', hasAppliance: true, floor: '3' },
      { value: '310', label: '310', hasAppliance: true, floor: '3' },
      { value: '311', label: '311', hasAppliance: true, floor: '3' },
      { value: '312', label: '312', hasAppliance: true, floor: '3' },
      { value: '501', label: '501', hasAppliance: false, floor: '5' },
      { value: '502', label: '502', hasAppliance: true, floor: '5' },
      { value: '503', label: '503', hasAppliance: true, floor: '5' },
      { value: '505', label: '505', hasAppliance: true, floor: '5' },
      { value: '506', label: '506', hasAppliance: true, floor: '5' },
      { value: '507', label: '507', hasAppliance: true, floor: '5' },
      { value: '508', label: '508', hasAppliance: true, floor: '5' },
      { value: '509', label: '509', hasAppliance: false, floor: '5' },
      { value: '510', label: '510', hasAppliance: true, floor: '5' },
      { value: '511', label: '511', hasAppliance: true, floor: '5' },
      { value: '512', label: '512', hasAppliance: true, floor: '5' },
      { value: '601', label: '601', hasAppliance: true, floor: '6' },
      { value: '602', label: '602', hasAppliance: true, floor: '6' },
      { value: '603', label: '603', hasAppliance: true, floor: '6' },
      { value: '605', label: '605', hasAppliance: true, floor: '6' },
      { value: '606', label: '606', hasAppliance: true, floor: '6' },
      { value: '607', label: '607', hasAppliance: true, floor: '6' },
      { value: '608', label: '608', hasAppliance: true, floor: '6' },
      { value: '609', label: '609', hasAppliance: true, floor: '6' },
      { value: '610', label: '610', hasAppliance: true, floor: '6' },
    ]
  }

  // 如果有指定樓層，只回傳該樓層的房間
  if (floor) {
    return allUnits.filter(unit => unit.floor === floor)
  }

  // 沒有指定樓層則回傳全部
  return allUnits
}
