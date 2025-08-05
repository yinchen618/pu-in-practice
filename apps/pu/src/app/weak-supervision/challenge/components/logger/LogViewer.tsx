import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { LogEntry } from "./LogEntry";

export interface LogViewerProps {
	logs: string[];
	phase1Status?: "waiting" | "running" | "complete";
	phase2Status?: "waiting" | "running" | "complete";
	phase1Title?: string;
	phase2Title?: string;
	className?: string;
}

export function LogViewer({
	logs,
	phase1Status = "waiting",
	phase2Status = "waiting",
	phase1Title = "階段一",
	phase2Title = "階段二",
	className,
}: LogViewerProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	// 自動滾動到底部
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs]);

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			{/* 階段狀態指示器 */}
			<div className="grid grid-cols-2 gap-4">
				<PhaseStatus title={phase1Title} status={phase1Status} />
				<PhaseStatus title={phase2Title} status={phase2Status} />
			</div>

			{/* 日誌視窗 */}
			<div
				ref={scrollRef}
				className="h-[300px] overflow-y-auto rounded-lg border bg-white/50 backdrop-blur-sm"
			>
				<AnimatePresence mode="popLayout">
					{logs.map((log, index) => (
						<LogEntry
							key={index}
							message={log}
							type={getLogType(log)}
							className={index % 2 === 0 ? "bg-gray-50/50" : ""}
						/>
					))}
				</AnimatePresence>
			</div>
		</div>
	);
}

// 階段狀態顯示組件
function PhaseStatus({
	title,
	status,
}: {
	title: string;
	status: "waiting" | "running" | "complete";
}) {
	return (
		<div className="flex items-center gap-2 rounded-lg border bg-white/80 p-3">
			<div
				className={cn(
					"h-2 w-2 rounded-full",
					status === "waiting" && "bg-gray-300",
					status === "running" &&
						"bg-blue-500 animate-pulse shadow-lg shadow-blue-200",
					status === "complete" && "bg-green-500",
				)}
			/>
			<div className="flex flex-col">
				<span className="text-sm font-medium">{title}</span>
				<span
					className={cn(
						"text-xs",
						status === "waiting" && "text-gray-500",
						status === "running" && "text-blue-600",
						status === "complete" && "text-green-600",
					)}
				>
					{status === "waiting" && "等待中..."}
					{status === "running" && "執行中..."}
					{status === "complete" && "完成 ✓"}
				</span>
			</div>
		</div>
	);
}

// 根據日誌內容判斷類型
function getLogType(log: string): "INFO" | "WARN" | "SUCCESS" {
	if (log.includes("⚠️")) {
		return "WARN";
	}
	if (log.includes("✅")) {
		return "SUCCESS";
	}
	return "INFO";
}
