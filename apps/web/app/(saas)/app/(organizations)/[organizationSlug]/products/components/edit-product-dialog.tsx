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
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ProductRecord } from "./columns";

const editProductSchema = z.object({
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
	description: z.string().optional(),
	status: z.enum(["active", "inactive"]),
	price: z.number().positive().optional(),
	currency: z.string().optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProductDialogProps {
	productRecord: ProductRecord;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function EditProductDialog({
	productRecord,
	open,
	onOpenChange,
	onSuccess,
}: EditProductDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<EditProductFormData>({
		resolver: zodResolver(editProductSchema),
	});

	const categoryValue = watch("category");
	const statusValue = watch("status");
	const currencyValue = watch("currency");

	// 當產品記錄改變時重置表單
	useEffect(() => {
		if (productRecord) {
			reset({
				name: productRecord.name,
				code: productRecord.code,
				category: productRecord.category as
					| "AQ"
					| "Bond"
					| "DCI"
					| "EQ"
					| "FCN"
					| "Fund"
					| "FX",
				description: productRecord.description || "",
				status: productRecord.status,
				price: productRecord.price || undefined,
				currency: productRecord.currency || "TWD",
			});
		}
	}, [productRecord, reset]);

	const onSubmit = async (data: EditProductFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/organizations/products/${productRecord.id}`,
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
				const error = await response.json();
				throw new Error(error.message || "更新失敗");
			}

			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error("更新產品失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>編輯產品</DialogTitle>
					<DialogDescription>編輯產品資訊。</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								產品名稱 *
							</Label>
							<div className="col-span-3">
								<Input
									id="name"
									{...register("name")}
									placeholder="輸入產品名稱"
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-red-500">
										{errors.name.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="code" className="text-right">
								產品代碼 *
							</Label>
							<div className="col-span-3">
								<Input
									id="code"
									{...register("code")}
									placeholder="輸入產品代碼"
								/>
								{errors.code && (
									<p className="mt-1 text-sm text-red-500">
										{errors.code.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="category" className="text-right">
								類別 *
							</Label>
							<div className="col-span-3">
								<Select
									value={categoryValue}
									onValueChange={(value) =>
										setValue(
											"category",
											value as
												| "AQ"
												| "Bond"
												| "DCI"
												| "EQ"
												| "FCN"
												| "Fund"
												| "FX",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇產品類別" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="AQ">AQ</SelectItem>
										<SelectItem value="Bond">
											債券
										</SelectItem>
										<SelectItem value="DCI">DCI</SelectItem>
										<SelectItem value="EQ">股票</SelectItem>
										<SelectItem value="FCN">FCN</SelectItem>
										<SelectItem value="Fund">
											基金
										</SelectItem>
										<SelectItem value="FX">外匯</SelectItem>
									</SelectContent>
								</Select>
								{errors.category && (
									<p className="mt-1 text-sm text-red-500">
										{errors.category.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="status" className="text-right">
								狀態 *
							</Label>
							<div className="col-span-3">
								<Select
									value={statusValue}
									onValueChange={(value) =>
										setValue(
											"status",
											value as "active" | "inactive",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇狀態" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">
											銷售中
										</SelectItem>
										<SelectItem value="inactive">
											已下架
										</SelectItem>
									</SelectContent>
								</Select>
								{errors.status && (
									<p className="mt-1 text-sm text-red-500">
										{errors.status.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="price" className="text-right">
								價格
							</Label>
							<div className="col-span-3">
								<Input
									id="price"
									type="number"
									step="0.01"
									{...register("price", {
										valueAsNumber: true,
									})}
									placeholder="輸入價格"
								/>
								{errors.price && (
									<p className="mt-1 text-sm text-red-500">
										{errors.price.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="currency" className="text-right">
								幣別
							</Label>
							<div className="col-span-3">
								<Select
									value={currencyValue}
									onValueChange={(value) =>
										setValue("currency", value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇幣別" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="TWD">TWD</SelectItem>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="EUR">EUR</SelectItem>
										<SelectItem value="JPY">JPY</SelectItem>
										<SelectItem value="CNY">CNY</SelectItem>
									</SelectContent>
								</Select>
								{errors.currency && (
									<p className="mt-1 text-sm text-red-500">
										{errors.currency.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-start gap-4">
							<Label
								htmlFor="description"
								className="text-right mt-2"
							>
								描述
							</Label>
							<div className="col-span-3">
								<Textarea
									id="description"
									{...register("description")}
									placeholder="輸入產品描述"
									className="min-h-[80px]"
								/>
								{errors.description && (
									<p className="mt-1 text-sm text-red-500">
										{errors.description.message}
									</p>
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							取消
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "更新中..." : "更新產品"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
