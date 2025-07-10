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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CURRENCY_OPTIONS, DISTRIBUTION_TYPE_OPTIONS } from "../../constants";

const ProductCategory = z.enum([
	"AQ",
	"Bond",
	"DCI",
	"EQ",
	"FCN",
	"Fund",
	"FX",
]);
const ProductStatus = z.enum(["active", "inactive"]);

const createSchema = z.object({
	category: ProductCategory,
	name: z.string().min(1, "產品名稱是必填的"),
	code: z.string().min(1, "產品代碼是必填的"),
	currency: z.string().min(1, "幣別是必填的"),
	distributionType: z.string().min(1, "配息方式是必填的"),
	description: z.string().optional(),
	status: ProductStatus,
});

type CreateFormData = z.infer<typeof createSchema>;

interface CreateDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateProductDialog({
	organizationId,
	onSuccess,
}: CreateDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<CreateFormData>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			category: "Fund",
			name: "",
			code: "",
			currency: "USD",
			distributionType: "MONTHLY",
			description: "",
			status: "active",
		},
	});

	const onSubmit = async (data: CreateFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/products", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...data, organizationId }),
			});

			if (!response.ok) {
				let errorMessage = "新增失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "新增失敗";
				}

				if (errorMessage.includes("代碼已被使用")) {
					form.setError("code", {
						type: "server",
						message: errorMessage,
					});
					return;
				}

				throw new Error(errorMessage);
			}

			form.reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("新增失敗:", error);
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>新增產品</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增產品。
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="grid gap-4 py-4">
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											類別 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇類別" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="AQ">
														AQ
													</SelectItem>
													<SelectItem value="Bond">
														債券
													</SelectItem>
													<SelectItem value="DCI">
														DCI
													</SelectItem>
													<SelectItem value="EQ">
														股票
													</SelectItem>
													<SelectItem value="FCN">
														FCN
													</SelectItem>
													<SelectItem value="Fund">
														基金
													</SelectItem>
													<SelectItem value="FX">
														外匯
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
								name="name"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											產品名稱 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder="輸入產品名稱"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											產品代碼 *
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Input
													placeholder="輸入產品代碼"
													{...field}
												/>
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
													{CURRENCY_OPTIONS.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="distributionType"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											配息方式 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇配息方式" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{DISTRIBUTION_TYPE_OPTIONS.map(
														(option) => (
															<SelectItem
																key={
																	option.value
																}
																value={
																	option.value
																}
															>
																{option.label}
															</SelectItem>
														),
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-start gap-4">
										<FormLabel className="text-right mt-2">
											描述
										</FormLabel>
										<div className="col-span-3">
											<FormControl>
												<Textarea
													placeholder="輸入產品描述"
													className="min-h-[80px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem className="grid grid-cols-4 items-center gap-4">
										<FormLabel className="text-right">
											狀態 *
										</FormLabel>
										<div className="col-span-3">
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="選擇狀態" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">
														銷售中
													</SelectItem>
													<SelectItem value="inactive">
														已下架
													</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "新增中..." : "新增"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
