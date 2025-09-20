'use client'

import { useCallback, useState } from 'react'
import DemoTab from './DemoTab'
import type { DataParams, ModelParams, SimulationResult } from './types'

export function DemoSection() {
  // 狀態管理
  const [algorithm, setAlgorithm] = useState<'uPU' | 'nnPU'>('uPU')

  // 三個關鍵 UI 功能與其他參數
  const [priorEstimationMethod, setPriorEstimationMethod] = useState<'mean' | 'median'>('median')
  const [hiddenSize, setHiddenSize] = useState<number>(200)
  const [lambdaRegularization, setLambdaRegularization] = useState<number>(0.005)
  const [learningRate, setLearningRate] = useState<number>(0.005)
  const [activationFunction, setActivationFunction] = useState<string>('relu')
  const [randomSeed, setRandomSeed] = useState<number>(42)
  const [epochs, setEpochs] = useState<number>(100)

  const [dataParams, setDataParams] = useState<DataParams>({
    distribution: 'gaussian',
    dimensions: 8,
    nPositive: 50,
    nUnlabeled: 300,
    prior: 0.3,
  })
  const [modelParams] = useState<ModelParams>({
    activation: 'relu',
    learning_rate: 0.005,
    weight_decay: 0.005,
  })
  const [isTraining, setIsTraining] = useState(false)
  const [results, setResults] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrain = useCallback(async () => {
    setIsTraining(true)
    setError(null)

    try {
      // 參數驗證
      if (hiddenSize < 1 || hiddenSize > 500) {
        throw new Error(`Hidden size must be between 1 and 500, got ${hiddenSize}`)
      }
      if (lambdaRegularization < 0 || lambdaRegularization > 0.1) {
        throw new Error(`Weight decay must be between 0.0 and 0.1, got ${lambdaRegularization}`)
      }
      if (dataParams.dimensions < 2 || dataParams.dimensions > 100) {
        throw new Error(`Dimensions must be between 2 and 100, got ${dataParams.dimensions}`)
      }
      if (dataParams.prior <= 0.05 || dataParams.prior >= 0.95) {
        throw new Error(`Prior must be between 0.05 and 0.95, got ${dataParams.prior}`)
      }

      // 構建 API 請求
      const apiRequest = {
        algorithm,
        seed: randomSeed,
        prior_estimation_method: priorEstimationMethod,
        epochs: epochs,
        data_params: {
          distribution: dataParams.distribution,
          dims: dataParams.dimensions,
          n_p: dataParams.nPositive,
          n_u: dataParams.nUnlabeled,
          prior: dataParams.prior,
        },
        model_params:
          algorithm === 'nnPU'
            ? {
                activation: activationFunction,
                n_epochs: epochs,
                learning_rate: learningRate,
                hidden_dim: hiddenSize,
                weight_decay: lambdaRegularization,
              }
            : {
                model_type: 'gauss',
                use_bias: true,
                n_basis: hiddenSize,
              },
      }

      // Timeout 控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const API_URL = 'https://weakrisk.yinchen.tw'
      const response = await fetch(`${API_URL}/api/pu-learning/run-simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(apiRequest),
        signal: controller.signal,
        keepalive: false,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend error details:', errorData)

        let errorMessage = `HTTP error! status: ${response.status}`

        if (response.status === 422) {
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const validationErrors = errorData.detail
              .map((err: any) => `${err.loc?.join('.')} - ${err.msg}`)
              .join('; ')
            errorMessage = `Parameter validation failed: ${validationErrors}`
          } else if (errorData.detail?.message) {
            errorMessage = `Validation error: ${errorData.detail.message}`
          } else {
            errorMessage = 'Parameter validation failed - please check your input values'
          }
        } else if (errorData.detail?.message) {
          errorMessage = errorData.detail.message
        }

        throw new Error(errorMessage)
      }

      const backendResult = await response.json()

      const result: SimulationResult = {
        visualization: {
          pSamples: backendResult.visualization.p_samples.map((point: number[]) => ({
            x: point[0],
            y: point[1],
            label: 'P' as const,
          })),
          uSamples: backendResult.visualization.u_samples.map((point: number[]) => ({
            x: point[0],
            y: point[1],
            label: 'U' as const,
          })),
          decisionBoundary: backendResult.visualization.decision_boundary,
        },
        metrics: {
          estimatedPrior: backendResult.metrics.estimated_prior,
          errorRate: backendResult.metrics.error_rate,
          trainingErrorRate: backendResult.metrics.training_error_rate,
          riskCurve: backendResult.metrics.risk_curve,
        },
      }

      setResults(result)
    } catch (err) {
      console.error('Training error:', err)
      let errorMessage: string
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Request timeout - Please check network connection or retry'
        } else if (err.message.includes('fetch')) {
          errorMessage = 'Cannot connect to backend service - Please ensure service is running'
        } else {
          errorMessage = err.message
        }
      } else {
        errorMessage = 'Unknown error occurred during training'
      }
      setError(errorMessage)
      console.warn('⚠️ Mock data has been disabled, please check backend service status')
    } finally {
      setIsTraining(false)
    }
  }, [
    algorithm,
    dataParams,
    modelParams,
    priorEstimationMethod,
    hiddenSize,
    lambdaRegularization,
    activationFunction,
    learningRate,
    randomSeed,
    epochs,
  ])

  // 快速設定
  const handleOptimalSetup = () => {
    setHiddenSize(200)
    setLambdaRegularization(0.005)
  }

  const handleBlindsEffectSetup = () => {
    setHiddenSize(500)
    setLambdaRegularization(0.01)
  }

  // 隨機種子
  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000)
    setRandomSeed(newSeed)
  }

  // 當前配置
  const currentConfig = {
    distribution: dataParams.distribution,
    dimensions: dataParams.dimensions,
    sampleSize: dataParams.nPositive + dataParams.nUnlabeled,
    positiveRatio: dataParams.nPositive / (dataParams.nPositive + dataParams.nUnlabeled),
    labelFrequency: dataParams.prior,
    hiddenSize,
  }

  return (
    <DemoTab
      algorithm={algorithm}
      setAlgorithm={setAlgorithm}
      priorEstimationMethod={priorEstimationMethod}
      setPriorEstimationMethod={setPriorEstimationMethod}
      hiddenSize={hiddenSize}
      setHiddenSize={setHiddenSize}
      lambdaRegularization={lambdaRegularization}
      setLambdaRegularization={setLambdaRegularization}
      learningRate={learningRate}
      setLearningRate={setLearningRate}
      activationFunction={activationFunction}
      setActivationFunction={setActivationFunction}
      epochs={epochs}
      setEpochs={setEpochs}
      randomSeed={randomSeed}
      setRandomSeed={setRandomSeed}
      handleRandomizeSeed={handleRandomizeSeed}
      dataParams={dataParams}
      setDataParams={setDataParams}
      isTraining={isTraining}
      handleTrain={handleTrain}
      error={error}
      results={results}
      currentConfig={currentConfig}
      handleOptimalSetup={handleOptimalSetup}
      handleBlindsEffectSetup={handleBlindsEffectSetup}
    />
  )
}

export default DemoSection
