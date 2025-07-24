import { AssetTransactionsTable } from "./asset-transactions/asset-transactions-table";

interface Props {
	customerId: string;
}

export function CustomerAssetsTab({ customerId }: Props) {
	return <AssetTransactionsTable customerId={customerId} />;
}
