import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import type { CustomerRecord } from "../../components/columns";

interface Props {
	customer: CustomerRecord;
}

export function CustomerBasicInfoCard({ customer }: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>基本資料</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<dt className="text-sm font-medium text-gray-500">
							客戶編號
						</dt>
						<dd className="mt-1 text-sm text-gray-900 font-mono">
							{customer.code}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							電子郵件
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.email}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							電話
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.phone || "-"}
						</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}
