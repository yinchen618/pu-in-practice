"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PYTHON_API_URL } from "@/config/api";
import { Image as ImageIcon, Loader2, Palette, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface StyleTransferResult {
	original_image: string;
	style: string;
	style_description: string;
	result_image: string;
	processing_time: number;
	success_rate: number;
	explanation: string;
}

const availableStyles = [
	{
		value: "vangogh",
		label: "梵谷風格",
		description: "充滿動感的筆觸和鮮豔的色彩",
	},
	{
		value: "ukiyo-e",
		label: "浮世繪風格",
		description: "日式傳統藝術的優雅線條",
	},
	{ value: "pixar", label: "皮克斯風格", description: "3D動畫的卡通化效果" },
	{
		value: "watercolor",
		label: "水彩風格",
		description: "柔和的色彩暈染效果",
	},
	{ value: "oil_painting", label: "油畫風格", description: "厚重的顏料質感" },
];

export default function StyleTransferPage() {
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [selectedStyle, setSelectedStyle] = useState<string>("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<StyleTransferResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedImage(file);
			setError(null);

			// 創建預覽 URL
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	const handleStyleTransfer = async () => {
		if (!selectedImage || !selectedStyle) {
			setError("請選擇圖片和風格");
			return;
		}

		setIsProcessing(true);
		setError(null);
		setResult(null);

		try {
			// 將圖片轉換為 base64
			const base64 = await fileToBase64(selectedImage);

			const response = await fetch(
				`${PYTHON_API_URL}/api/style-transfer`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						image_data: base64,
						style: selectedStyle,
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			setResult(data);

			console.log("風格轉換結果:", data);
		} catch (err) {
			console.error("風格轉換失敗:", err);
			setError(err instanceof Error ? err.message : "風格轉換失敗");
		} finally {
			setIsProcessing(false);
		}
	};

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => {
				const result = reader.result as string;
				// 移除 data:image/...;base64, 前綴
				const base64 = result.split(",")[1];
				resolve(base64);
			};
			reader.onerror = (error) => reject(error);
		});
	};

	const handleReset = () => {
		setSelectedImage(null);
		setSelectedStyle("");
		setResult(null);
		setError(null);
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="container mx-auto px-6 py-8">
				{/* 頁面標題 */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
						<Palette className="text-pink-500" />
						風格轉換藝術
					</h1>
					<p className="text-xl text-gray-600">
						使用神經風格轉換技術，將您的照片轉換為藝術作品
					</p>
				</div>

				<div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* 左側：控制面板 */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Upload className="text-blue-500" />
									上傳圖片
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="image-upload">
										選擇圖片
									</Label>
									<input
										ref={fileInputRef}
										id="image-upload"
										type="file"
										accept="image/*"
										onChange={handleImageSelect}
										className="hidden"
									/>
									<Button
										variant="outline"
										onClick={() =>
											fileInputRef.current?.click()
										}
										className="w-full"
									>
										<ImageIcon className="mr-2 h-4 w-4" />
										選擇圖片
									</Button>
								</div>

								{previewUrl && (
									<div className="space-y-2">
										<Label>預覽</Label>
										<div className="border rounded-lg overflow-hidden">
											<img
												src={previewUrl}
												alt="預覽"
												className="w-full h-48 object-cover"
											/>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Palette className="text-purple-500" />
									選擇風格
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="style-select">
										藝術風格
									</Label>
									<Select
										value={selectedStyle}
										onValueChange={setSelectedStyle}
									>
										<SelectTrigger>
											<SelectValue placeholder="選擇風格..." />
										</SelectTrigger>
										<SelectContent>
											{availableStyles.map((style) => (
												<SelectItem
													key={style.value}
													value={style.value}
												>
													<div>
														<div className="font-medium">
															{style.label}
														</div>
														<div className="text-sm text-gray-500">
															{style.description}
														</div>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{selectedStyle && (
									<div className="p-4 bg-gray-50 rounded-lg">
										<h4 className="font-medium mb-2">
											{
												availableStyles.find(
													(s) =>
														s.value ===
														selectedStyle,
												)?.label
											}
										</h4>
										<p className="text-sm text-gray-600">
											{
												availableStyles.find(
													(s) =>
														s.value ===
														selectedStyle,
												)?.description
											}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						<div className="flex gap-4">
							<Button
								onClick={handleStyleTransfer}
								disabled={
									!selectedImage ||
									!selectedStyle ||
									isProcessing
								}
								className="flex-1"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										處理中...
									</>
								) : (
									<>
										<Palette className="mr-2 h-4 w-4" />
										開始轉換
									</>
								)}
							</Button>
							<Button variant="outline" onClick={handleReset}>
								重置
							</Button>
						</div>

						{error && (
							<Card className="border-red-200 bg-red-50">
								<CardContent className="pt-6">
									<p className="text-red-600">{error}</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* 右側：結果展示 */}
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>轉換結果</CardTitle>
							</CardHeader>
							<CardContent>
								{result ? (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label className="text-sm font-medium">
													原始圖片
												</Label>
												<div className="border rounded-lg overflow-hidden mt-2">
													<img
														src={previewUrl || ""}
														alt="原始圖片"
														className="w-full h-48 object-cover"
													/>
												</div>
											</div>
											<div>
												<Label className="text-sm font-medium">
													風格轉換結果
												</Label>
												<div className="border rounded-lg overflow-hidden mt-2">
													<img
														src={
															result.result_image
														}
														alt="轉換結果"
														className="w-full h-48 object-cover"
													/>
												</div>
											</div>
										</div>

										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span>處理時間:</span>
												<span className="font-medium">
													{result.processing_time} 秒
												</span>
											</div>
											<div className="flex justify-between text-sm">
												<span>成功率:</span>
												<span className="font-medium">
													{(
														result.success_rate *
														100
													).toFixed(1)}
													%
												</span>
											</div>
											<div className="flex justify-between text-sm">
												<span>風格:</span>
												<span className="font-medium">
													{result.style_description}
												</span>
											</div>
										</div>

										<div className="p-4 bg-blue-50 rounded-lg">
											<p className="text-sm text-blue-800">
												{result.explanation}
											</p>
										</div>
									</div>
								) : (
									<div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
										<div className="text-center text-gray-500">
											<ImageIcon className="mx-auto h-12 w-12 mb-4" />
											<p>選擇圖片和風格後開始轉換</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
