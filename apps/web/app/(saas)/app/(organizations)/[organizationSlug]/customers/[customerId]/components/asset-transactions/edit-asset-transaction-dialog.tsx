"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AssetTransactionRecord } from "./columns";

const editAssetTransactionSchema = z.object({
	date: z.string().min(1, "日期是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	type: z.enum(["IN", "OUT"], {
		errorMap: () => ({ message: "請選擇交易類型" }),
	}),
	amount: z.number().min(0, "金額不能為負數"),
	description: z.string().optional(),
});

type EditAssetTransactionFormData = z.infer<typeof editAssetTransactionSchema>;

interface EditAssetTransactionDialogProps {
	record: AssetTransactionRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditAssetTransactionDialog({
	record,
	open,
	onOpenChange,
	onSuccess,
}: EditAssetTransactionDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const form = useForm<EditAssetTransactionFormData>({
		resolver: zodResolver(editAssetTransactionSchema),
		defaultValues: {
			date: "",
			currency: "USD",
			type: "IN",
			amount: 0,
			description: "",
		},
	});

	useEffect(() => {
		if (record) {
			form.reset({
				date: new Date(record.date).toISOString().split("T")[0],
				currency: record.currency,
				type: record.type,
				amount: record.amount,
				description: record.description || "",
			});
		}
	}, [record, form]);

	const onSubmit = async (data: EditAssetTransactionFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/asset-transactions/${record.id}`,
				{
					method: "PUT",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (!response.ok) {
				let errorMessage = "更新失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "更新失敗";
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新資產交易失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(
				`/api/organizations/asset-transactions/${record.id}`,
				{
					method: "DELETE",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				let errorMessage = "刪除失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "刪除失敗";
				}
				throw new Error(errorMessage);
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("刪除資產交易失敗:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>編輯資產交易</DialogTitle>
					<DialogDescription>
						修改下方資訊來更新資產交易記錄。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											日期 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="currency"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											幣別 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇幣別" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="USD">
														USD
													</SelectItem>
													<SelectItem value="TWD">
														TWD
													</SelectItem>
													<SelectItem value="SGD">
														SGD
													</SelectItem>
													<SelectItem value="HKD">
														HKD
													</SelectItem>
													<SelectItem value="EUR">
														EUR
													</SelectItem>
													<SelectItem value="JPY">
														JPY
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											類型 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇類型" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="IN">
														入金
													</SelectItem>
													<SelectItem value="OUT">
														出金
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											金額 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="輸入金額"
													{...field}
													onChange={(e) => {
														const value =
															e.target.value;
														field.onChange(
															value === ""
																? 0
																: Number(value),
														);
													}}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											說明
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Textarea
													placeholder="輸入說明（選填）"
													className="resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="!justify-between">
							<Button
								type="button"
								variant="error"
								onClick={handleDelete}
								disabled={isDeleting}
							>
								<Trash2 className="mr-2 size-4" />
								{isDeleting ? "刪除中..." : "刪除"}
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									取消
								</Button>
								<Button type="submit" disabled={isLoading}>
									{isLoading ? "更新中..." : "更新"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
