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
	DialogTrigger,
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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createProductSchema = z.object({
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	category: z.enum(["AQ", "Bond", "DCI", "EQ", "FCN", "Fund", "FX"]),
	description: z.string().optional(),
	price: z.number().positive().optional(),
	currency: z.string().optional(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

interface CreateProductDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateProductDialog({
	organizationId,
	onSuccess,
}: CreateProductDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<CreateProductFormData>({
		resolver: zodResolver(createProductSchema),
		defaultValues: {
			category: "EQ",
			currency: "TWD",
		},
	});

	const categoryValue = watch("category");
	const currencyValue = watch("currency");

	const onSubmit = async (data: CreateProductFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/products", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...data,
					organizationId,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "創建失敗");
			}

			// 重置表單並關閉對話框
			reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("創建產品失敗:", error);
			// 這裡可以添加 toast 通知
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					新增產品
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>新增產品</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一個產品。
					</DialogDescription>
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
							onClick={() => {
								reset();
								setOpen(false);
							}}
						>
							取消
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "創建中..." : "創建產品"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
