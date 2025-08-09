// 異常事件類型定義
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

// 異常事件統計
export interface AnomalyEventStats {
	total: number;
	unreviewed: number;
	confirmed: number;
	rejected: number;
	avgScore?: number;
	maxScore?: number;
	uniqueMeters?: number;
}

// API 回應類型
export interface AnomalyEventsResponse {
	events: AnomalyEvent[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// 審核資料類型
export interface ReviewEventData {
	status: "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	reviewerId: string;
	justificationNotes?: string;
	labelIds?: string[];
}

// 篩選器類型
export interface EventFilters {
	status?: string;
	meterId?: string;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	limit?: number;
}
