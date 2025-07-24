import { Badge } from "@ui/components/badge";

export interface CurrencyBalance {
	currency: string;
	balance: number;
	inAmount: number;
	outAmount: number;
}

export interface BalanceSummaryProps {
	balances: CurrencyBalance[];
	isLoading: boolean;
}

export function BalanceSummary({ balances, isLoading }: BalanceSummaryProps) {
	if (isLoading) {
		// 骨架效果
		return (
			<div className="space-y-3">
				<h3 className="text-sm font-medium text-gray-700">目前結餘</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="p-4 border rounded-lg bg-gray-50 animate-pulse"
						>
							<div className="flex items-center justify-between mb-2">
								<div className="h-4 w-12 bg-gray-200 rounded" />
								<div className="h-6 w-24 bg-gray-200 rounded" />
							</div>
							<div className="space-y-1">
								<div className="h-3 w-20 bg-gray-100 rounded" />
								<div className="h-3 w-20 bg-gray-100 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}
	if (!balances || balances.length === 0)
		return <div className="text-sm text-gray-500">目前沒有資產記錄</div>;
	return (
		<div className="space-y-3">
			<h3 className="text-sm font-medium text-gray-700">目前結餘</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{balances.map((balance) => (
					<div
						key={balance.currency}
						className="p-4 border rounded-lg bg-gray-50"
					>
						<div className="flex items-center justify-between mb-2">
							<Badge status="info" className="font-mono">
								{balance.currency}
							</Badge>
							<div className="text-right">
								<div
									className={`text-lg font-bold font-mono ${balance.balance >= 0 ? "text-green-600" : "text-red-600"}`}
								>
									{balance.balance >= 0 ? "+" : ""}
									{Number(balance.balance).toLocaleString()}
								</div>
							</div>
						</div>
						<div className="text-xs text-gray-500 space-y-1">
							<div className="flex justify-between">
								<span>入金總額:</span>
								<span className="text-green-600 font-mono">
									+{Number(balance.inAmount).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between">
								<span>出金總額:</span>
								<span className="text-red-600 font-mono">
									-
									{Number(balance.outAmount).toLocaleString()}
								</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
