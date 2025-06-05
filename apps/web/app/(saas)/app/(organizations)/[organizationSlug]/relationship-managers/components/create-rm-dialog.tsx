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
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createRMSchema = z.object({
	name: z.string().min(1, "姓名是必填的"),
	email: z.string().email("請輸入有效的電子郵件"),
	phone: z.string().optional(),
	category: z.enum(["FINDER", "RM", "BOTH"]),
});

type CreateRMFormData = z.infer<typeof createRMSchema>;

interface CreateRMDialogProps {
	organizationId: string;
	onSuccess?: () => void;
}

export function CreateRMDialog({
	organizationId,
	onSuccess,
}: CreateRMDialogProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
		watch,
	} = useForm<CreateRMFormData>({
		resolver: zodResolver(createRMSchema),
		defaultValues: {
			category: "RM",
		},
	});

	const categoryValue = watch("category");

	const onSubmit = async (data: CreateRMFormData) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				"/api/organizations/relationship-managers",
				{
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...data,
						organizationId,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "創建失敗");
			}

			// 重置表單並關閉對話框
			reset();
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			console.error("創建 RM 失敗:", error);
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
					新增 RM
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>新增客戶關係經理</DialogTitle>
					<DialogDescription>
						填寫下方資訊來新增一位客戶關係經理。
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								姓名 *
							</Label>
							<div className="col-span-3">
								<Input
									id="name"
									{...register("name")}
									placeholder="輸入姓名"
								/>
								{errors.name && (
									<p className="mt-1 text-sm text-red-500">
										{errors.name.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="email" className="text-right">
								電子郵件 *
							</Label>
							<div className="col-span-3">
								<Input
									id="email"
									type="email"
									{...register("email")}
									placeholder="輸入電子郵件"
								/>
								{errors.email && (
									<p className="mt-1 text-sm text-red-500">
										{errors.email.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="phone" className="text-right">
								電話
							</Label>
							<div className="col-span-3">
								<Input
									id="phone"
									type="tel"
									{...register("phone")}
									placeholder="輸入電話號碼"
								/>
								{errors.phone && (
									<p className="mt-1 text-sm text-red-500">
										{errors.phone.message}
									</p>
								)}
							</div>
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="category" className="text-right">
								RM 類別 *
							</Label>
							<div className="col-span-3">
								<Select
									value={categoryValue}
									onValueChange={(value) =>
										setValue(
											"category",
											value as "FINDER" | "RM" | "BOTH",
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="選擇 RM 類別" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="RM">RM</SelectItem>
										<SelectItem value="FINDER">
											FINDER
										</SelectItem>
										<SelectItem value="BOTH">
											BOTH
										</SelectItem>
									</SelectContent>
								</Select>
								{errors.category && (
									<p className="mt-1 text-sm text-red-500">
										{errors.category.message}
									</p>
								)}
							</div>
						</div>
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
							{isLoading ? "創建中..." : "創建"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
