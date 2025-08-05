export interface AnomalyEvent {
	id: string;
	eventId: string;
	meterId: string;
	eventTimestamp: string;
	detectionRule: string;
	score: number;
	status: "UNREVIEWED" | "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	reviewerId?: string;
	reviewTimestamp?: string;
	justificationNotes?: string;
	createdAt: string;
	updatedAt: string;
	dataWindow?: {
		timestamps: string[];
		values: number[];
	};
	eventLabelLinks?: {
		label: AnomalyLabel;
	}[];
}

export interface AnomalyLabel {
	id: string;
	name: string;
	description?: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface AnomalyEventStats {
	total: number;
	unreviewed: number;
	confirmed: number;
	rejected: number;
}

export interface EventFilters {
	status?: "UNREVIEWED" | "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	meterId?: string;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
}

export interface ReviewDecision {
	status: "CONFIRMED_POSITIVE" | "REJECTED_NORMAL";
	justificationNotes?: string;
	labelIds?: string[];
}
