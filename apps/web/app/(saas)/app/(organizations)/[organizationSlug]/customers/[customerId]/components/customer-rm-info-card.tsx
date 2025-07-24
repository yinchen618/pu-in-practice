import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import type { CustomerRecord } from "../../components/columns";

interface Props {
	customer: CustomerRecord;
}

export function CustomerRMInfoCard({ customer }: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>客戶關係經理</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-1 sm:grid-cols-4 gap-4">
					<div>
						<dt className="text-sm font-medium text-gray-500">
							負責 RM1
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.rm1Name || "-"}
							{customer.rm1ProfitShare && (
								<span className="text-gray-500 ml-2">
									({customer.rm1ProfitShare}%)
								</span>
							)}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							負責 RM2
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.rm2Name || "-"}
							{customer.rm2ProfitShare && (
								<span className="text-gray-500 ml-2">
									({customer.rm2ProfitShare}%)
								</span>
							)}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							負責 Finder1
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.finder1Name || "-"}
							{customer.finder1ProfitShare && (
								<span className="text-gray-500 ml-2">
									({customer.finder1ProfitShare}%)
								</span>
							)}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							負責 Finder2
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.finder2Name || "-"}
							{customer.finder2ProfitShare && (
								<span className="text-gray-500 ml-2">
									({customer.finder2ProfitShare}%)
								</span>
							)}
						</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}
