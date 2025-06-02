import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { ScrollArea } from "@ui/components/scroll-area";
import { Textarea } from "@ui/components/textarea";
import { Loader2Icon } from "lucide-react";

export interface BatchAddDialogProps<T> {
	showBatchAddDialog: boolean;
	setShowBatchAddDialog: (show: boolean) => void;
	title: string;
	columnMappings: Array<{ id: string; header: string }>;
	batchAddContent: string;
	setBatchAddContent: (content: string) => void;
	batchAddErrors: string[];
	isBatchAdding: boolean;
	handleBatchAdd: () => void;
}

export function BatchAddDialog<T>({
	showBatchAddDialog,
	setShowBatchAddDialog,
	title,
	columnMappings,
	batchAddContent,
	setBatchAddContent,
	batchAddErrors,
	isBatchAdding,
	handleBatchAdd,
}: BatchAddDialogProps<T>) {
	return (
		<Dialog open={showBatchAddDialog} onOpenChange={setShowBatchAddDialog}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>批量新增{title}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label>列名對應說明</Label>
						<ScrollArea className="h-24 rounded-md border p-2">
							<div className="space-y-1">
								{columnMappings.map((col, index) => (
									<div key={col.id} className="text-sm">
										第{index + 1}欄: {col.header} ({col.id})
									</div>
								))}
							</div>
						</ScrollArea>
					</div>
					<div className="grid gap-2">
						<Label>CSV 格式數據（每行一筆）</Label>
						<Textarea
							value={batchAddContent}
							onChange={(e) => setBatchAddContent(e.target.value)}
							placeholder="請輸入 CSV 格式數據，每行一筆..."
							className="min-h-[200px]"
						/>
					</div>
					{batchAddErrors.length > 0 && (
						<div className="rounded-md bg-destructive/10 p-3">
							<div className="text-sm font-medium text-destructive">
								錯誤信息：
							</div>
							<ul className="mt-2 list-inside list-disc text-sm text-destructive">
								{batchAddErrors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setShowBatchAddDialog(false)}
						disabled={isBatchAdding}
					>
						取消
					</Button>
					<Button onClick={handleBatchAdd} disabled={isBatchAdding}>
						{isBatchAdding ? (
							<>
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								處理中...
							</>
						) : (
							"確認新增"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
