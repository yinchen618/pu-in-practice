import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { useTranslations } from "next-intl";
import type { CustomerRecord } from "../../components/columns";

interface Props {
	customer: CustomerRecord;
}

export function CustomerBasicInfoCard({ customer }: Props) {
	const t = useTranslations("organization.customers.basicInfo");

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div>
						<dt className="text-sm font-medium text-gray-500">
							{t("customerCode")}
						</dt>
						<dd className="mt-1 text-sm text-gray-900 font-mono">
							{customer.code}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							{t("email")}
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.email || t("noData")}
						</dd>
					</div>
					<div>
						<dt className="text-sm font-medium text-gray-500">
							{t("phone")}
						</dt>
						<dd className="mt-1 text-sm text-gray-900">
							{customer.phone || t("noData")}
						</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}
