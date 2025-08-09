import { useCallback, useState } from "react";

// 定義類型接口
export interface AnomalyEvent {
	id: string;
	eventId: string;
	meterId: string;
	eventTimestamp: string;
	detectionRule: string;
	score: number;
	dataWindow?: {
		timestamps: string[];
		values: number[];
	};
	status: "UNREVIEWED" | "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	reviewerId?: string;
	reviewTimestamp?: string;
	justificationNotes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AnomalyEventsResponse {
	events: AnomalyEvent[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface AnomalyLabel {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface AnomalyStats {
	totalEvents: number;
	unreviewedCount: number;
	confirmedCount: number;
	rejectedCount: number;
	avgScore: number;
	maxScore: number;
	uniqueMeters: number;
}

export interface EventFilters {
	status?: string;
	meterId?: string;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
	experimentRunId?: string;
}

export interface CreateEventData {
	eventId: string;
	meterId: string;
	eventTimestamp: string;
	detectionRule: string;
	score: number;
	dataWindow: {
		timestamps: string[];
		values: number[];
	};
}

export interface ReviewEventData {
	status: "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	reviewerId: string;
	justificationNotes?: string;
	labelIds?: string[];
}

export interface CreateLabelData {
	name: string;
	description?: string;
}

export interface UpdateLabelData {
	name?: string;
	description?: string;
}

// API 客戶端
class CaseStudyAPIClient {
	private baseUrl = "http://localhost:8000/api/v1";

	async getAnomalyEvents(
		filters: EventFilters = {},
	): Promise<AnomalyEventsResponse> {
		// 將 camelCase 轉為後端 API 期望的 snake_case
		const mapped: Record<string, any> = {};
		for (const [k, v] of Object.entries(filters)) {
			if (v === undefined) continue;
			switch (k) {
				case "meterId":
					mapped.meter_id = v;
					break;
				case "dateFrom":
					mapped.date_from = v;
					break;
				case "dateTo":
					mapped.date_to = v;
					break;
				case "page":
					mapped.page = v;
					break;
				case "limit":
					mapped.limit = v;
					break;
				case "experimentRunId":
					mapped.experiment_run_id = v;
					break;
				default:
					mapped[k] = v;
			}
		}

		const params = new URLSearchParams(
			Object.fromEntries(Object.entries(mapped)),
		);

		const response = await fetch(`${this.baseUrl}/events?${params}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch anomaly events: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async getAnomalyEventDetail(eventId: string): Promise<AnomalyEvent> {
		const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch anomaly event: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async createAnomalyEvent(data: CreateEventData): Promise<AnomalyEvent> {
		const response = await fetch(`${this.baseUrl}/events`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(
				`Failed to create anomaly event: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async deleteAnomalyEvent(eventId: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to delete anomaly event: ${response.status}`,
			);
		}
	}

	async getAnomalyStats(experimentRunId?: string): Promise<AnomalyStats> {
		const url = experimentRunId
			? `${this.baseUrl}/stats?experiment_run_id=${encodeURIComponent(experimentRunId)}`
			: `${this.baseUrl}/stats`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch anomaly stats: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async getAnomalyLabels(): Promise<AnomalyLabel[]> {
		const response = await fetch(`${this.baseUrl}/labels`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch anomaly labels: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async createAnomalyLabel(data: CreateLabelData): Promise<AnomalyLabel> {
		const response = await fetch(`${this.baseUrl}/labels`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(
				`Failed to create anomaly label: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async updateAnomalyLabel(
		labelId: string,
		data: UpdateLabelData,
	): Promise<AnomalyLabel> {
		const response = await fetch(`${this.baseUrl}/labels/${labelId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(
				`Failed to update anomaly label: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async deleteAnomalyLabel(labelId: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/labels/${labelId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to delete anomaly label: ${response.status}`,
			);
		}
	}

	async reviewAnomalyEvent(
		eventId: string,
		reviewData: {
			status: string;
			reviewerId: string;
			justificationNotes?: string;
		},
	): Promise<AnomalyEvent> {
		// 後端已提供 /events/{id}/label 作為標註端點
		const response = await fetch(
			`${this.baseUrl}/events/${eventId}/label`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					status: reviewData.status,
					reviewer_id: reviewData.reviewerId,
					justification_notes: reviewData.justificationNotes,
				}),
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to review anomaly event: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success) {
			// 後端此路由回應的是狀態訊息，重新讀取事件細節
			return this.getAnomalyEventDetail(eventId);
		}
		throw new Error("Invalid API response format");
	}

	async getProjectInsights(): Promise<any> {
		const response = await fetch(`${this.baseUrl}/project/insights`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`Failed to fetch project insights: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async uploadEventsFile(file: File): Promise<any> {
		const formData = new FormData();
		formData.append("file", file);

		const response = await fetch(`${this.baseUrl}/events/upload`, {
			method: "POST",
			body: formData,
		});

		if (!response.ok) {
			throw new Error(`Failed to upload file: ${response.status}`);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async getUploadStatus(taskId: string): Promise<any> {
		const response = await fetch(
			`${this.baseUrl}/events/upload/${taskId}/status`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to get upload status: ${response.status}`);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}
}

const caseStudyAPI = new CaseStudyAPIClient();

export function useCaseStudyData() {
	// Events 資料狀態
	const [events, setEvents] = useState<AnomalyEventsResponse | null>(null);
	const [eventsLoading, setEventsLoading] = useState(false);

	// Stats 資料狀態
	const [stats, setStats] = useState<AnomalyStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);

	// Labels 資料狀態
	const [labels, setLabels] = useState<AnomalyLabel[]>([]);
	const [labelsLoading, setLabelsLoading] = useState(false);

	// 載入異常事件列表
	const loadEvents = useCallback(async (filters: EventFilters = {}) => {
		setEventsLoading(true);
		try {
			const data = await caseStudyAPI.getAnomalyEvents(filters);
			setEvents(data);
		} catch (err) {
			console.error("Failed to load anomaly events:", err);
			// 設置空資料，防止界面卡住
			setEvents({
				events: [],
				total: 0,
				page: 1,
				limit: 50,
				totalPages: 0,
			});
			// 可以添加 toast 通知或其他錯誤處理
		} finally {
			setEventsLoading(false);
		}
	}, []);

	// 載入統計資料
	const loadStats = useCallback(async (experimentRunId?: string) => {
		setStatsLoading(true);
		try {
			const data = await caseStudyAPI.getAnomalyStats(experimentRunId);
			setStats(data);
		} catch (err) {
			console.error("Failed to load anomaly stats:", err);
			// 設置預設統計資料
			setStats({
				totalEvents: 0,
				unreviewedCount: 0,
				confirmedCount: 0,
				rejectedCount: 0,
				avgScore: 0,
				maxScore: 0,
				uniqueMeters: 0,
			});
		} finally {
			setStatsLoading(false);
		}
	}, []);

	// 載入標籤列表
	const loadLabels = useCallback(async () => {
		setLabelsLoading(true);
		try {
			const data = await caseStudyAPI.getAnomalyLabels();
			setLabels(data);
		} catch (err) {
			console.error("Failed to load anomaly labels:", err);
			// 設置空標籤列表
			setLabels([]);
		} finally {
			setLabelsLoading(false);
		}
	}, []);

	return {
		// Events data
		events,
		eventsLoading,
		loadEvents,

		// Stats data
		stats,
		statsLoading,
		loadStats,

		// Labels data
		labels,
		labelsLoading,
		loadLabels,

		// API methods
		getEventDetail: caseStudyAPI.getAnomalyEventDetail.bind(caseStudyAPI),
		createEvent: caseStudyAPI.createAnomalyEvent.bind(caseStudyAPI),
		reviewEvent: caseStudyAPI.reviewAnomalyEvent.bind(caseStudyAPI),
		deleteEvent: caseStudyAPI.deleteAnomalyEvent.bind(caseStudyAPI),
		createLabel: caseStudyAPI.createAnomalyLabel.bind(caseStudyAPI),
		updateLabel: caseStudyAPI.updateAnomalyLabel.bind(caseStudyAPI),
		deleteLabel: caseStudyAPI.deleteAnomalyLabel.bind(caseStudyAPI),
		getProjectInsights: caseStudyAPI.getProjectInsights.bind(caseStudyAPI),
		uploadEventsFile: caseStudyAPI.uploadEventsFile.bind(caseStudyAPI),
		getUploadStatus: caseStudyAPI.getUploadStatus.bind(caseStudyAPI),
	};
}

// 導出 API 實例供直接使用
export { caseStudyAPI };
