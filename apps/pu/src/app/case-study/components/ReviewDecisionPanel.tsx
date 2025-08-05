"use client";

import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Plus,
	Tag,
	User,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import { Textarea } from "../../../components/ui/textarea";
import type { AnomalyEvent, AnomalyLabel, ReviewDecision } from "./types";

interface ReviewDecisionPanelProps {
	selectedEvent: AnomalyEvent | null;
	organizationId: string;
	onReviewSubmitted: () => void;
}

export function ReviewDecisionPanel({
	selectedEvent,
	organizationId,
	onReviewSubmitted,
}: ReviewDecisionPanelProps) {
	const [decision, setDecision] = useState<
		"CONFIRMED_POSITIVE" | "REJECTED_NORMAL" | null
	>(null);
	const [justificationNotes, setJustificationNotes] = useState("");
	const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
	const [availableLabels, setAvailableLabels] = useState<AnomalyLabel[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	// 獲取可用標籤
	const fetchLabels = async () => {
		if (!organizationId) {
			return;
		}

		try {
			const response = await fetch(
				`/api/casestudy/labels?organizationId=${organizationId}`,
				{
					credentials: "include",
					headers: { "Content-Type": "application/json" },
				},
			);

			if (response.ok) {
				const result = await response.json();
				setAvailableLabels(result.data || []);
			}
		} catch (error) {
			console.error("獲取標籤列表失敗:", error);
		}
	};

	// 重置表單
	const resetForm = () => {
		setDecision(null);
		setJustificationNotes("");
		setSelectedLabels([]);
		setShowSuccess(false);
	};

	// 當選中事件變化時重置表單
	useEffect(() => {
		resetForm();
		if (selectedEvent && organizationId) {
			fetchLabels();

			// 如果事件已經有標籤，預選它們
			if (selectedEvent.eventLabelLinks) {
				const labelIds = selectedEvent.eventLabelLinks.map(
					(link) => link.label.id,
				);
				setSelectedLabels(labelIds);
			}

			// 如果已經審核過，填入之前的資料
			if (selectedEvent.status !== "UNREVIEWED") {
				setDecision(selectedEvent.status);
				if (selectedEvent.justificationNotes) {
					setJustificationNotes(selectedEvent.justificationNotes);
				}
			}
		}
	}, [selectedEvent?.id, organizationId]);

	// 處理標籤選擇
	const handleLabelToggle = (labelId: string) => {
		setSelectedLabels((prev) =>
			prev.includes(labelId)
				? prev.filter((id) => id !== labelId)
				: [...prev, labelId],
		);
	};

	// 提交審核決策
	const handleSubmitReview = async () => {
		if (!selectedEvent || !decision) {
			return;
		}

		setIsSubmitting(true);
		try {
			const reviewData: ReviewDecision = {
				status: decision,
				justificationNotes: justificationNotes.trim() || undefined,
				labelIds:
					decision === "CONFIRMED_POSITIVE"
						? selectedLabels
						: undefined,
			};

			const response = await fetch(
				`/api/casestudy/events/${selectedEvent.id}/review`,
				{
					method: "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(reviewData),
				},
			);

			if (response.ok) {
				setShowSuccess(true);
				setTimeout(() => {
					setShowSuccess(false);
					onReviewSubmitted();
				}, 2000);
			} else {
				const error = await response.text();
				console.error("審核提交失敗:", error);
				alert("審核提交失敗，請重試");
			}
		} catch (error) {
			console.error("審核提交失敗:", error);
			alert("審核提交失敗，請重試");
		} finally {
			setIsSubmitting(false);
		}
	};

	// 格式化時間
	const formatDateTime = (timestamp: string) => {
		return new Date(timestamp).toLocaleString("zh-TW", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// 獲取狀態顯示資訊
	const getStatusDisplay = (status: AnomalyEvent["status"]) => {
		switch (status) {
			case "UNREVIEWED":
				return {
					text: "待審核",
					color: "bg-orange-100 text-orange-800",
					icon: AlertTriangle,
				};
			case "CONFIRMED_POSITIVE":
				return {
					text: "已確認異常",
					color: "bg-green-100 text-green-800",
					icon: CheckCircle,
				};
			case "REJECTED_NORMAL":
				return {
					text: "已駁回正常",
					color: "bg-red-100 text-red-800",
					icon: XCircle,
				};
		}
	};

	if (!selectedEvent) {
		return (
			<div className="w-80 border-l bg-gray-50 p-4">
				<div className="text-center">
					<User className="size-16 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						審核與決策
					</h3>
					<p className="text-gray-500 text-sm">
						選擇一個異常事件來開始審核流程
					</p>
				</div>
			</div>
		);
	}

	const statusInfo = getStatusDisplay(selectedEvent.status);
	const StatusIcon = statusInfo.icon;
	const isAlreadyReviewed = selectedEvent.status !== "UNREVIEWED";

	return (
		<div className="w-80 border-l bg-white flex flex-col">
			{/* 成功提示 */}
			{showSuccess && (
				<Alert className="m-4 border-green-200 bg-green-50">
					<CheckCircle className="size-4 text-green-600" />
					<AlertDescription className="text-green-800">
						審核結果已成功提交！
					</AlertDescription>
				</Alert>
			)}

			{/* 標題 */}
			<div className="border-b p-4">
				<h3 className="text-lg font-semibold text-gray-900 mb-2">
					審核與決策
				</h3>
				<div className="flex items-center gap-2">
					<StatusIcon
						className={`size-4 ${
							statusInfo.color.includes("orange")
								? "text-orange-600"
								: statusInfo.color.includes("green")
									? "text-green-600"
									: "text-red-600"
						}`}
					/>
					<Badge className={statusInfo.color}>
						{statusInfo.text}
					</Badge>
				</div>
			</div>

			{/* 滾動內容區域 */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* 事件基本資訊 */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							事件資訊
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div>
							<span className="font-medium text-gray-600">
								事件ID:
							</span>
							<div className="text-gray-900">
								{selectedEvent.eventId}
							</div>
						</div>
						<div>
							<span className="font-medium text-gray-600">
								電錶ID:
							</span>
							<div className="text-gray-900">
								{selectedEvent.meterId}
							</div>
						</div>
						<div>
							<span className="font-medium text-gray-600">
								偵測規則:
							</span>
							<div className="text-gray-900">
								{selectedEvent.detectionRule}
							</div>
						</div>
						<div>
							<span className="font-medium text-gray-600">
								異常分數:
							</span>
							<div className="text-red-600 font-semibold">
								{selectedEvent.score.toFixed(2)}
							</div>
						</div>
						<div>
							<span className="font-medium text-gray-600">
								發生時間:
							</span>
							<div className="text-gray-900">
								{formatDateTime(selectedEvent.eventTimestamp)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 審核歷史（如果已審核過） */}
				{isAlreadyReviewed && (
					<Card>
						<CardHeader>
							<CardTitle className="text-sm font-medium flex items-center gap-2">
								<Calendar className="size-4" />
								審核歷史
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div>
								<span className="font-medium text-gray-600">
									審核時間:
								</span>
								<div className="text-gray-900">
									{selectedEvent.reviewTimestamp
										? formatDateTime(
												selectedEvent.reviewTimestamp,
											)
										: "未知"}
								</div>
							</div>
							{selectedEvent.justificationNotes && (
								<div>
									<span className="font-medium text-gray-600">
										審核理由:
									</span>
									<div className="text-gray-900 mt-1 p-2 bg-gray-50 rounded text-xs">
										{selectedEvent.justificationNotes}
									</div>
								</div>
							)}
							{selectedEvent.eventLabelLinks &&
								selectedEvent.eventLabelLinks.length > 0 && (
									<div>
										<span className="font-medium text-gray-600">
											已標記標籤:
										</span>
										<div className="flex flex-wrap gap-1 mt-1">
											{selectedEvent.eventLabelLinks.map(
												(link) => (
													<Badge
														key={link.label.id}
														variant="secondary"
														className="text-xs"
													>
														{link.label.name}
													</Badge>
												),
											)}
										</div>
									</div>
								)}
						</CardContent>
					</Card>
				)}

				<Separator />

				{/* 決策區域 */}
				<div className="space-y-4">
					<h4 className="font-medium text-gray-900">
						{isAlreadyReviewed ? "重新審核" : "做出決策"}
					</h4>

					{/* 決策按鈕 */}
					<div className="space-y-2">
						<Button
							variant={
								decision === "CONFIRMED_POSITIVE"
									? "default"
									: "outline"
							}
							className={`w-full justify-start gap-2 ${
								decision === "CONFIRMED_POSITIVE"
									? "bg-green-600 hover:bg-green-700"
									: "border-green-600 text-green-600 hover:bg-green-50"
							}`}
							onClick={() => setDecision("CONFIRMED_POSITIVE")}
						>
							<CheckCircle className="size-4" />
							確認為異常事件
						</Button>

						<Button
							variant={
								decision === "REJECTED_NORMAL"
									? "default"
									: "outline"
							}
							className={`w-full justify-start gap-2 ${
								decision === "REJECTED_NORMAL"
									? "bg-red-600 hover:bg-red-700"
									: "border-red-600 text-red-600 hover:bg-red-50"
							}`}
							onClick={() => setDecision("REJECTED_NORMAL")}
						>
							<XCircle className="size-4" />
							駁回為正常狀況
						</Button>
					</div>

					{/* 標籤選擇（僅在確認異常時顯示） */}
					{decision === "CONFIRMED_POSITIVE" && (
						<div className="space-y-3">
							<Label className="text-sm font-medium flex items-center gap-2">
								<Tag className="size-4" />
								選擇標籤 (可選)
							</Label>

							{availableLabels.length === 0 ? (
								<div className="text-sm text-gray-500 text-center p-3 border border-dashed rounded">
									暫無可用標籤
									<br />
									<Button
										variant="link"
										size="sm"
										className="text-xs"
									>
										<Plus className="size-3 mr-1" />
										新增標籤
									</Button>
								</div>
							) : (
								<div className="space-y-2 max-h-40 overflow-y-auto">
									{availableLabels.map((label) => (
										<div
											key={label.id}
											className="flex items-start space-x-2 p-2 border rounded hover:bg-gray-50"
										>
											<Checkbox
												id={`label-${label.id}`}
												checked={selectedLabels.includes(
													label.id,
												)}
												onCheckedChange={() =>
													handleLabelToggle(label.id)
												}
											/>
											<div className="flex-1 min-w-0">
												<label
													htmlFor={`label-${label.id}`}
													className="text-sm font-medium text-gray-900 cursor-pointer"
												>
													{label.name}
												</label>
												{label.description && (
													<p className="text-xs text-gray-500 mt-1">
														{label.description}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* 審核理由 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							審核理由 (可選)
						</Label>
						<Textarea
							placeholder="請描述您的判斷理由、觀察到的模式或其他重要資訊..."
							value={justificationNotes}
							onChange={(e) =>
								setJustificationNotes(e.target.value)
							}
							rows={4}
							className="text-sm resize-none"
						/>
					</div>
				</div>
			</div>

			{/* 提交按鈕 */}
			<div className="border-t p-4">
				<Button
					onClick={handleSubmitReview}
					disabled={!decision || isSubmitting}
					className="w-full"
				>
					{isSubmitting
						? "提交中..."
						: isAlreadyReviewed
							? "更新審核結果"
							: "提交審核結果"}
				</Button>

				{decision && (
					<p className="text-xs text-gray-500 mt-2 text-center">
						{decision === "CONFIRMED_POSITIVE"
							? `將標記為異常事件${selectedLabels.length > 0 ? ` (${selectedLabels.length}個標籤)` : ""}`
							: "將標記為正常狀況"}
					</p>
				)}
			</div>
		</div>
	);
}
