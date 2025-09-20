// API client for Case Study v2

import type {
  AnomalyEvent,
  AvailableModel,
  DataSourceConfig,
  EvaluationJobResponse,
  ExperimentHistory,
  ExperimentRun,
  FilteringParameters,
  ModelConfig,
  TrainingJobResponse,
} from '../types'

const API_BASE = 'https://weakrisk.yinchen.tw/api/v2'

class CaseStudyV2API {
  // ========== Experiment Runs ==========

  async createExperimentRun(data: {
    name: string
    description?: string
    filtering_parameters: FilteringParameters
  }): Promise<ExperimentRun> {
    const response = await fetch(`${API_BASE}/experiment-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create experiment run: ${response.statusText}`)
    }

    return response.json()
  }

  async getExperimentRuns(): Promise<ExperimentRun[]> {
    const response = await fetch(`${API_BASE}/experiment-runs`)

    if (!response.ok) {
      throw new Error(`Failed to fetch experiment runs: ${response.statusText}`)
    }

    return response.json()
  }

  async getExperimentRun(id: string): Promise<ExperimentRun> {
    const response = await fetch(`${API_BASE}/experiment-runs/${id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch experiment run: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteExperimentRun(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/experiment-runs/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete experiment run: ${response.statusText}`)
    }

    return response.json()
  }

  // ========== Anomaly Events ==========

  async getExperimentCandidates(experimentRunId: string): Promise<AnomalyEvent[]> {
    const response = await fetch(`${API_BASE}/experiment-runs/${experimentRunId}/candidates`)

    if (!response.ok) {
      throw new Error(`Failed to fetch candidates: ${response.statusText}`)
    }

    return response.json()
  }

  async labelAnomalyEvent(
    eventId: string,
    data: {
      status: 'CONFIRMED_POSITIVE' | 'REJECTED_NORMAL'
      reviewer_id: string
      justification_notes?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/anomaly-events/${eventId}/label`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to label event: ${response.statusText}`)
    }

    return response.json()
  }

  // ========== Training and Evaluation ==========

  async startTrainingJob(data: {
    model_name: string
    scenario_type: 'ERM_BASELINE' | 'GENERALIZATION_CHALLENGE' | 'DOMAIN_ADAPTATION'
    experiment_run_id: string
    model_config: ModelConfig
    data_source_config: DataSourceConfig
  }): Promise<TrainingJobResponse> {
    const response = await fetch(`${API_BASE}/training-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to start training job: ${response.statusText}`)
    }

    return response.json()
  }

  async startEvaluationJob(data: {
    evaluation_name: string
    scenario_type: 'ERM_BASELINE' | 'GENERALIZATION_CHALLENGE' | 'DOMAIN_ADAPTATION'
    trained_model_id: string
    test_set_source: {
      source_type: string
      experiment_run_id?: string
      external_dataset_id?: string
    }
  }): Promise<EvaluationJobResponse> {
    const response = await fetch(`${API_BASE}/evaluation-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to start evaluation job: ${response.statusText}`)
    }

    return response.json()
  }

  // ========== Experiment History ==========

  async getExperimentHistory(experimentRunId: string): Promise<ExperimentHistory> {
    const response = await fetch(`${API_BASE}/experiment-runs/${experimentRunId}/history`)

    if (!response.ok) {
      throw new Error(`Failed to fetch experiment history: ${response.statusText}`)
    }

    return response.json()
  }

  // ========== Available Models ==========

  async getAvailableModels(): Promise<AvailableModel[]> {
    const response = await fetch(`${API_BASE}/models`)

    if (!response.ok) {
      throw new Error(`Failed to fetch available models: ${response.statusText}`)
    }

    return response.json()
  }

  // ========== WebSocket Connections ==========

  connectToTrainingLogs(jobId: string, onMessage: (message: string) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8002/ws/v2/training-jobs/${jobId}/logs`)

    ws.onmessage = event => {
      onMessage(event.data)
    }

    ws.onerror = error => {
      console.error('Training logs WebSocket error:', error)
    }

    // Implement heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    ws.onclose = () => {
      clearInterval(heartbeat)
    }

    return ws
  }

  connectToEvaluationLogs(jobId: string, onMessage: (message: string) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8002/ws/v2/evaluation-jobs/${jobId}/logs`)

    ws.onmessage = event => {
      onMessage(event.data)
    }

    ws.onerror = error => {
      console.error('Evaluation logs WebSocket error:', error)
    }

    // Implement heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 30000)

    ws.onclose = () => {
      clearInterval(heartbeat)
    }

    return ws
  }
}

export const caseStudyV2API = new CaseStudyV2API()
