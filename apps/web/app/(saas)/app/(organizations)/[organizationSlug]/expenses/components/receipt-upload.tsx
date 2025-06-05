"use client";

import { config } from "@repo/config";
import { useSignedUploadUrlMutation } from "@saas/shared/lib/api";
import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import { FileImage, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

interface ReceiptUploadProps {
	value?: string[];
	onChange: (urls: string[]) => void;
	className?: string;
}

export function ReceiptUpload({
	value = [],
	onChange,
	className,
}: ReceiptUploadProps) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const getSignedUploadUrlMutation = useSignedUploadUrlMutation();

	const handleFileSelect = async (files: FileList) => {
		if (!files || files.length === 0) {
			return;
		}

		// 檢查檔案類型
		const validTypes = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"application/pdf",
		];

		const invalidFiles = Array.from(files).filter(
			(file) => !validTypes.includes(file.type),
		);
		if (invalidFiles.length > 0) {
			setError("請選擇圖片檔案（JPG、PNG、WebP）或 PDF");
			return;
		}

		// 檢查檔案大小 (5MB)
		const oversizedFiles = Array.from(files).filter(
			(file) => file.size > 5 * 1024 * 1024,
		);
		if (oversizedFiles.length > 0) {
			setError("檔案大小不能超過 5MB");
			return;
		}

		setUploading(true);
		setError(null);

		try {
			const uploadPromises = Array.from(files).map(async (file) => {
				const fileExtension = file.name.split(".").pop() || "jpg";
				const fileName = `receipt-${uuid()}.${fileExtension}`;

				// 獲取簽名上傳 URL
				const { signedUrl } =
					await getSignedUploadUrlMutation.mutateAsync({
						path: fileName,
						bucket: config.storage.bucketNames.receipts,
					});

				// 上傳檔案
				const uploadResponse = await fetch(signedUrl, {
					method: "PUT",
					body: file,
					headers: {
						"Content-Type": file.type,
					},
				});

				if (!uploadResponse.ok) {
					throw new Error(`上傳 ${file.name} 失敗`);
				}

				return fileName;
			});

			const uploadedFileNames = await Promise.all(uploadPromises);

			// 將新上傳的檔案添加到現有檔案列表
			onChange([...value, ...uploadedFileNames]);
		} catch (error) {
			console.error("上傳收據失敗:", error);
			setError("上傳失敗，請重試");
		} finally {
			setUploading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			handleFileSelect(files);
		}
	};

	const handleRemove = (indexToRemove: number) => {
		const newFiles = value.filter((_, index) => index !== indexToRemove);
		onChange(newFiles);
	};

	const handleRemoveAll = () => {
		onChange([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const getReceiptUrl = (path: string) => {
		return `/image-proxy/${config.storage.bucketNames.receipts}/${path}`;
	};

	// 拖拽事件處理 - 使用更簡單的方法來處理拖拽狀態
	const dragRef = useRef<HTMLLabelElement>(null);
	const dragLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// 清理計時器
	useEffect(() => {
		return () => {
			if (dragLeaveTimeoutRef.current) {
				clearTimeout(dragLeaveTimeoutRef.current);
			}
		};
	}, []);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// 清除可能存在的離開計時器
		if (dragLeaveTimeoutRef.current) {
			clearTimeout(dragLeaveTimeoutRef.current);
			dragLeaveTimeoutRef.current = null;
		}

		// 只處理有檔案的拖拽
		if (e.dataTransfer.types?.includes("Files")) {
			setIsDragOver(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// 使用延遲來處理拖拽離開，避免在子元素間移動時誤觸發
		dragLeaveTimeoutRef.current = setTimeout(() => {
			setIsDragOver(false);
		}, 50);
	}, []);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			// 檢查是否有檔案被拖拽
			const hasFiles = e.dataTransfer.types?.includes("Files");

			if (hasFiles) {
				// 設置拖拽效果
				e.dataTransfer.dropEffect = "copy";

				// 確保拖拽進入時顯示正確樣式
				if (!isDragOver) {
					setIsDragOver(true);
				}
			}
		},
		[isDragOver],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			// 清除離開計時器並重置拖拽狀態
			if (dragLeaveTimeoutRef.current) {
				clearTimeout(dragLeaveTimeoutRef.current);
				dragLeaveTimeoutRef.current = null;
			}
			setIsDragOver(false);

			const files = e.dataTransfer.files;
			if (files && files.length > 0) {
				handleFileSelect(files);
			}
		},
		[handleFileSelect],
	);

	return (
		<div className={cn("space-y-4", className)}>
			<Label>收據附件</Label>

			{/* 上傳區域 */}
			<label
				ref={dragRef}
				htmlFor="file-upload-input"
				className={cn(
					"block border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
					isDragOver
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-muted-foreground/50",
					uploading && "pointer-events-none opacity-50",
				)}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<input
					id="file-upload-input"
					ref={fileInputRef}
					type="file"
					accept="image/*,.pdf"
					multiple
					onChange={handleInputChange}
					className="hidden"
					disabled={uploading}
				/>

				<Upload
					className={cn(
						"mx-auto h-8 w-8 mb-2 transition-colors",
						isDragOver ? "text-primary" : "text-muted-foreground",
					)}
				/>

				{isDragOver ? (
					<>
						<p className="text-sm text-primary mb-2 font-medium">
							放開以上傳檔案
						</p>
						<p className="text-xs text-muted-foreground">
							支援 JPG、PNG、WebP、PDF，最大 5MB
						</p>
					</>
				) : (
					<>
						<p className="text-sm text-muted-foreground mb-2">
							拖拽檔案到此處或點擊選擇收據檔案
						</p>
						<p className="text-xs text-muted-foreground mb-4">
							支援多個檔案上傳，JPG、PNG、WebP、PDF，每個檔案最大
							5MB
						</p>
						<Button
							type="button"
							variant="outline"
							disabled={uploading}
							onClick={(e) => {
								e.preventDefault();
								// label 已經處理點擊事件，不需要額外觸發
							}}
						>
							{uploading ? "上傳中..." : "選擇檔案"}
						</Button>
					</>
				)}
			</label>

			{/* 已上傳檔案列表 */}
			{value.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">
							已上傳檔案 ({value.length})
						</span>
						{value.length > 1 && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleRemoveAll}
								className="text-xs"
							>
								全部移除
							</Button>
						)}
					</div>
					<div className="space-y-2">
						{value.map((fileUrl, index) => (
							<div
								key={index}
								className="border rounded-lg p-3 bg-muted/50"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<FileImage className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">
											收據 {index + 1}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											asChild
										>
											<a
												href={getReceiptUrl(fileUrl)}
												target="_blank"
												rel="noopener noreferrer"
											>
												查看
											</a>
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => handleRemove(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{error && <p className="text-sm text-red-500">{error}</p>}
		</div>
	);
}
