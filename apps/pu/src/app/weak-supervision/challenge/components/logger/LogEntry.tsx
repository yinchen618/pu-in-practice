import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface LogEntryProps {
	message: string;
	timestamp?: string;
	type?: "INFO" | "WARN" | "SUCCESS";
	className?: string;
}

export function LogEntry({ message, type = "INFO", className }: LogEntryProps) {
	// 解析日誌訊息中的時間戳、時間差和類型圖示
	const match = message.match(/\[(.*?)\](\s*\(\+.*?\))?\s*(ℹ️|⚠️|✅)\s*(.*)/);
	if (!match) return null;

	const [, timestamp, timeDiff, icon, content] = match;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn(
				"flex items-start gap-2 px-3 py-1 text-sm font-mono",
				type === "WARN" && "text-yellow-500 bg-yellow-50/50",
				type === "SUCCESS" && "text-green-600 bg-green-50/50",
				className,
			)}
		>
			{/* 時間戳部分 */}
			<div className="flex-shrink-0 text-gray-500">
				<span className="opacity-75">[{timestamp}]</span>
				{timeDiff && (
					<span className="ml-1 text-xs opacity-50">{timeDiff}</span>
				)}
			</div>

			{/* 圖示 */}
			<span className="flex-shrink-0">{icon}</span>

			{/* 內容 */}
			<span className="flex-grow">{content}</span>
		</motion.div>
	);
}
