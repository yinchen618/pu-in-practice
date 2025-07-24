import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { BalanceSummary } from "./asset-transactions/balance-summary";

interface Props {
	balances: {
		currency: string;
		balance: number;
		inAmount: number;
		outAmount: number;
	}[];
	isLoading: boolean;
}

export function CustomerBalanceSummaryCard({ balances, isLoading }: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>資產結餘</CardTitle>
			</CardHeader>
			<CardContent>
				<BalanceSummary balances={balances} isLoading={isLoading} />
			</CardContent>
		</Card>
	);
}
