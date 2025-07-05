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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createCustomerSchema = z.object({
	name: z.string().min(1, "客戶名稱是必填的"),
	code: z.string().min(1, "客戶編號是必填的"),
	email: z.string().email("請輸入有效的電子郵件"),
	phone: z.string().optional(),
	rm1Id: z.string().optional(),
	rm1ProfitShare: z
		.number()
		.min(0, "利潤分享比例不能小於0")
		.max(100, "利潤分享比例不能大於100")
		.optional(),
	rm2Id: z.string().optional(),
	rm2ProfitShare: z
		.number()
		.min(0, "利潤分享比例不能小於0")
		.max(100, "利潤分享比例不能大於100")
		.optional(),
	finder1Id: z.string().optional(),
	finder1ProfitShare: z
		.number()
		.min(0, "利潤分享比例不能小於0")
		.max(100, "利潤分享比例不能大於100")
		.optional(),
	finder2Id: z.string().optional(),
	finder2ProfitShare: z
		.number()
		.min(0, "利潤分享比例不能小於0")
		.max(100, "利潤分享比例不能大於100")
		.optional(),
});

type CreateCustomerForm = z.infer<typeof createCustomerSchema>;

interface RelationshipManager {
	id: string;
	name: string;
	category: "RM" | "FINDER" | "BOTH";
}

interface CreateCustomerDialogProps {
	organizationId: string;
	relationshipManagers: RelationshipManager[];
	onSuccess: () => void;
}

export function CreateCustomerDialog({
	organizationId,
	relationshipManagers,
	onSuccess,
}: CreateCustomerDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// 根據角色類型過濾 RM 和 Finder 列表
	const rmOptions = relationshipManagers.filter(
		(rm) => rm.category === "RM" || rm.category === "BOTH",
	);
	const finderOptions = relationshipManagers.filter(
		(rm) => rm.category === "FINDER" || rm.category === "BOTH",
	);

	const form = useForm<CreateCustomerForm>({
		resolver: zodResolver(createCustomerSchema),
		defaultValues: {
			name: "",
			code: "",
			email: "",
			phone: "",
			rm1Id: "none",
			rm1ProfitShare: undefined,
			rm2Id: "none",
			rm2ProfitShare: undefined,
			finder1Id: "none",
			finder1ProfitShare: undefined,
			finder2Id: "none",
			finder2ProfitShare: undefined,
		},
	});

	const onSubmit = async (data: CreateCustomerForm) => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/organizations/customers", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					...data,
					organizationId,
					// 過濾"none"值，將其轉換為 undefined
					rm1Id: data.rm1Id === "none" ? undefined : data.rm1Id,
					rm2Id: data.rm2Id === "none" ? undefined : data.rm2Id,
					finder1Id:
						data.finder1Id === "none" ? undefined : data.finder1Id,
					finder2Id:
						data.finder2Id === "none" ? undefined : data.finder2Id,
					// 處理ProfitShare，將空值或0轉換為null
					rm1ProfitShare: data.rm1ProfitShare || null,
					rm2ProfitShare: data.rm2ProfitShare || null,
					finder1ProfitShare: data.finder1ProfitShare || null,
					finder2ProfitShare: data.finder2ProfitShare || null,
				}),
			});

			if (response.ok) {
				form.reset();
				setOpen(false);
				onSuccess();
			} else {
				let errorMessage = "新增客戶失敗";
				try {
					const responseText = await response.text();
					try {
						const error = JSON.parse(responseText);
						errorMessage = error.message || errorMessage;
					} catch {
						errorMessage = responseText || errorMessage;
					}
				} catch {
					errorMessage = "新增客戶失敗";
				}

				// 根據錯誤類型設定對應欄位錯誤
				if (errorMessage.includes("電子郵件已被使用")) {
					form.setError("email", {
						type: "server",
						message: errorMessage,
					});
					return;
				}

				if (errorMessage.includes("客戶編號已被使用")) {
					form.setError("code", {
						type: "server",
						message: errorMessage,
					});
					return;
				}

				console.error("新增客戶失敗:", errorMessage);
			}
		} catch (error) {
			console.error("新增客戶失敗:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 size-4" />
					新增客戶
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>新增客戶</DialogTitle>
					<DialogDescription>
						填寫客戶基本資料，並指派負責的 RM 和 Finder
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>客戶名稱</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入客戶名稱"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field, fieldState }) => (
									<FormItem>
										<FormLabel>客戶編號</FormLabel>
										<FormControl>
											<Input
												placeholder="輸入客戶編號"
												{...field}
												className={
													fieldState.error
														? "border-red-500 focus:border-red-500 focus:ring-red-500"
														: ""
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>電子郵件</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="輸入電子郵件"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="phone"
							render={({ field }) => (
								<FormItem>
									<FormLabel>電話</FormLabel>
									<FormControl>
										<Input
											placeholder="輸入電話號碼"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="rm1Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 RM1</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"rm1ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 RM1" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{rmOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="rm1ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											RM1 利潤分享比例 (%)
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0"
												max="100"
												placeholder="0.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseFloat(
																	e.target
																		.value,
																)
															: undefined,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="rm2Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 RM2</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"rm2ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 RM2" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{rmOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="rm2ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											RM2 利潤分享比例 (%)
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0"
												max="100"
												placeholder="0.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseFloat(
																	e.target
																		.value,
																)
															: undefined,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="finder1Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 Finder1</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"finder1ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 Finder1" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{finderOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="finder1ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Finder1 利潤分享比例 (%)
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0"
												max="100"
												placeholder="0.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseFloat(
																	e.target
																		.value,
																)
															: undefined,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="finder2Id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>負責 Finder2</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												if (value === "none") {
													form.setValue(
														"finder2ProfitShare",
														0,
													);
												}
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="選擇 Finder2" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="none">
													無
												</SelectItem>
												{finderOptions.map((rm) => (
													<SelectItem
														key={rm.id}
														value={rm.id}
													>
														{rm.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="finder2ProfitShare"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Finder2 利潤分享比例 (%)
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0"
												max="100"
												placeholder="0.00"
												{...field}
												onChange={(e) =>
													field.onChange(
														e.target.value
															? Number.parseFloat(
																	e.target
																		.value,
																)
															: undefined,
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								取消
							</Button>
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
