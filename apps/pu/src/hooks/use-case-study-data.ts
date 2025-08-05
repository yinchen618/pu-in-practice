import { useState } from "react";

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
	organizationId: string;
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
	organizationId: string;
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
	organizationId: string;
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
	organizationId: string;
}

export interface UpdateLabelData {
	name?: string;
	description?: string;
}

// API 客戶端
class CaseStudyAPIClient {
	private baseUrl = "https://python.yinchen.tw";

	async getAnomalyEvents(
		organizationId: string,
		filters: EventFilters = {},
	): Promise<AnomalyEventsResponse> {
		const params = new URLSearchParams({
			organization_id: organizationId,
			...Object.fromEntries(
				Object.entries(filters).filter(([_, v]) => v !== undefined),
			),
		});

		const response = await fetch(
			`${this.baseUrl}/api/case-study/events?${params}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

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
		const response = await fetch(
			`${this.baseUrl}/api/case-study/events/${eventId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

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
		const response = await fetch(`${this.baseUrl}/api/case-study/events`, {
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

	async reviewAnomalyEvent(
		eventId: string,
		reviewData: ReviewEventData,
	): Promise<AnomalyEvent> {
		const response = await fetch(
			`${this.baseUrl}/api/case-study/events/${eventId}/review`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(reviewData),
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to review anomaly event: ${response.status}`,
			);
		}

		const result = await response.json();
		if (result.success && result.data) {
			return result.data;
		}
		throw new Error("Invalid API response format");
	}

	async deleteAnomalyEvent(eventId: string): Promise<void> {
		const response = await fetch(
			`${this.baseUrl}/api/case-study/events/${eventId}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to delete anomaly event: ${response.status}`,
			);
		}
	}

	async getAnomalyStats(organizationId: string): Promise<AnomalyStats> {
		const response = await fetch(
			`${this.baseUrl}/api/case-study/stats?organization_id=${organizationId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

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

	async getAnomalyLabels(organizationId: string): Promise<AnomalyLabel[]> {
		const response = await fetch(
			`${this.baseUrl}/api/case-study/labels?organization_id=${organizationId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

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
		const response = await fetch(`${this.baseUrl}/api/case-study/labels`, {
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
		const response = await fetch(
			`${this.baseUrl}/api/case-study/labels/${labelId}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			},
		);

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
		const response = await fetch(
			`${this.baseUrl}/api/case-study/labels/${labelId}`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to delete anomaly label: ${response.status}`,
			);
		}
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
	const loadEvents = async (
		organizationId: string,
		filters: EventFilters = {},
	) => {
		setEventsLoading(true);
		try {
			const data = await caseStudyAPI.getAnomalyEvents(
				organizationId,
				filters,
			);
			setEvents(data);
		} catch (err) {
			console.error("Failed to load anomaly events:", err);
		} finally {
			setEventsLoading(false);
		}
	};

	// 載入統計資料
	const loadStats = async (organizationId: string) => {
		setStatsLoading(true);
		try {
			const data = await caseStudyAPI.getAnomalyStats(organizationId);
			setStats(data);
		} catch (err) {
			console.error("Failed to load anomaly stats:", err);
		} finally {
			setStatsLoading(false);
		}
	};

	// 載入標籤列表
	const loadLabels = async (organizationId: string) => {
		setLabelsLoading(true);
		try {
			const data = await caseStudyAPI.getAnomalyLabels(organizationId);
			setLabels(data);
		} catch (err) {
			console.error("Failed to load anomaly labels:", err);
		} finally {
			setLabelsLoading(false);
		}
	};

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
	};
}

// 導出 API 實例供直接使用
export { caseStudyAPI };
