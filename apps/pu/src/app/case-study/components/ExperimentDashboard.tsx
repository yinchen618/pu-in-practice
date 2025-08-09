"use client";

import {
Calendar,
Database,
Loader2,
Plus,
Settings,
Target,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { SimpleModal } from "./SimpleModal";

interface ExperimentRun {
id: string;
name: string;
description?: string;
status: "CONFIGURING" | "LABELING" | "COMPLETED";
candidateCount?: number;
positiveLabelCount?: number;
negativeLabelCount?: number;
createdAt: string;
updatedAt: string;
}

interface ExperimentDashboardProps {
onSelectExperiment: (experimentId: string) => void;
onCreateNew: () => void;
}

export function ExperimentDashboard({
onSelectExperiment,
onCreateNew,
}: ExperimentDashboardProps) {
const [experiments, setExperiments] = useState<ExperimentRun[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isCreating, setIsCreating] = useState(false);
const [showCreateModal, setShowCreateModal] = useState(false);
const [newExperimentName, setNewExperimentName] = useState("");
const [newExperimentDescription, setNewExperimentDescription] = useState("");

// 載入實驗列表
const loadExperiments = useCallback(async () => {
setIsLoading(true);
try {
const response = await fetch(
"http://localhost:8000/api/v1/experiment-runs",
);
if (response.ok) {
const data = await response.json();
setExperiments(data.data);
} else {
console.error("Failed to load experiments");
}
} catch (error) {
console.error("Error loading experiments:", error);
} finally {
setIsLoading(false);
}
}, []);

// 創建新實驗
const createExperiment = useCallback(async () => {
if (!newExperimentName.trim()) {
alert("請輸入實驗名稱");
return;
}

setIsCreating(true);
try {
const response = await fetch(
"http://localhost:8000/api/v1/experiment-runs",
{
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
name: newExperimentName.trim(),
description: newExperimentDescription.trim() || null,
}),
},
);

if (response.ok) {
const data = await response.json();
const newExperiment = data.data;

// 重新載入實驗列表
await loadExperiments();

// 清空表單並關閉對話框
setNewExperimentName("");
setNewExperimentDescription("");
setShowCreateModal(false);

// 自動選擇新創建的實驗並開始配置
onSelectExperiment(newExperiment.id);
onCreateNew();
} else {
console.error("Failed to create experiment");
alert("創建實驗失敗，請重試");
}
} catch (error) {
console.error("Error creating experiment:", error);
alert("創建實驗時發生錯誤，請重試");
} finally {
setIsCreating(false);
}
}, [
newExperimentName,
newExperimentDescription,
loadExperiments,
onSelectExperiment,
onCreateNew,
]);

// 選擇實驗
const selectExperiment = useCallback(
(experimentId: string) => {
onSelectExperiment(experimentId);
onCreateNew(); // 進入配置頁面
},
[onSelectExperiment, onCreateNew],
);

// 初始載入
useEffect(() => {
loadExperiments();
}, [loadExperiments]);

// 狀態顏色映射
const getStatusColor = (status: string) => {
switch (status) {
case "CONFIGURING":
return "bg-yellow-100 text-yellow-800";
case "LABELING":
return "bg-blue-100 text-blue-800";
case "COMPLETED":
return "bg-green-100 text-green-800";
default:
return "bg-gray-100 text-gray-800";
}
};

// 狀態文字映射
const getStatusText = (status: string) => {
switch (status) {
case "CONFIGURING":
return "配置中";
case "LABELING":
return "標記中";
case "COMPLETED":
return "已完成";
default:
return status;
}
};

return (
<div className="space-y-6">
{/* Page Header */}
<Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
<CardHeader>
<CardTitle className="flex items-center text-2xl text-indigo-900">
<Database className="h-6 w-6 mr-3" />
實驗管理儀表板
</CardTitle>
<p className="text-indigo-700 mt-2">
管理您的異常檢測實驗批次，追踪每一次科學實驗的完整過程和結果
</p>
</CardHeader>
</Card>

{/* Action Bar */}
<Card>
<CardHeader>
<div className="flex items-center justify-between">
<CardTitle className="text-lg">實驗批次列表</CardTitle>
<Button
className="bg-indigo-600 hover:bg-indigo-700"
onClick={() => setShowCreateModal(true)}
>
<Plus className="h-4 w-4 mr-2" />
創建新的實驗批次
</Button>
</div>
</CardHeader>

<CardContent>
{isLoading ? (
<div className="flex items-center justify-center py-8">
<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
<span className="ml-2 text-gray-600">載入實驗列表中...</span>
</div>
) : experiments.length === 0 ? (
<div className="text-center py-8">
<Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
<p className="text-gray-500 mb-4">尚未創建任何實驗批次</p>
<Button
className="bg-indigo-600 hover:bg-indigo-700"
onClick={() => setShowCreateModal(true)}
>
<Plus className="h-4 w-4 mr-2" />
創建第一個實驗
</Button>
</div>
) : (
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
{experiments.map((experiment) => (
<Card
key={experiment.id}
className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-200"
onClick={() => selectExperiment(experiment.id)}
>
<CardHeader className="pb-3">
<div className="flex items-center justify-between">
<CardTitle className="text-lg">
{experiment.name}
</CardTitle>
<Badge
className={`${getStatusColor(experiment.status)} font-medium`}
>
{getStatusText(experiment.status)}
</Badge>
</div>
{experiment.description && (
<p className="text-sm text-gray-600 mt-1">
{experiment.description}
</p>
)}
</CardHeader>
<CardContent className="pt-0">
<div className="space-y-2 text-sm">
<div className="flex items-center justify-between">
<span className="text-gray-500 flex items-center">
<Target className="h-4 w-4 mr-1" />
候選數量
</span>
<span className="font-medium">
{experiment.candidateCount || 0}
</span>
</div>
<div className="flex items-center justify-between">
<span className="text-gray-500 flex items-center">
<Settings className="h-4 w-4 mr-1" />
已標記
</span>
<span className="font-medium">
{(experiment.positiveLabelCount || 0) +
(experiment.negativeLabelCount || 0)}
</span>
</div>
<div className="flex items-center justify-between">
<span className="text-gray-500 flex items-center">
<Calendar className="h-4 w-4 mr-1" />
創建時間
</span>
<span className="font-medium">
{new Date(experiment.createdAt).toLocaleDateString()}
</span>
</div>
</div>
</CardContent>
</Card>
))}
</div>
)}
</CardContent>
</Card>

{/* 簡化提示信息 */}
{experiments.length > 0 && (
<Alert>
<Database className="h-4 w-4" />
<AlertDescription>
點擊任一實驗卡片以繼續該實驗的配置或標記工作。每個實驗都會保存完整的參數和標記歷史。
</AlertDescription>
</Alert>
)}

{/* 創建實驗的 Modal */}
<SimpleModal
isOpen={showCreateModal}
onClose={() => setShowCreateModal(false)}
title="創建新的實驗批次"
>
<div className="space-y-4">
<p className="text-gray-600 mb-4">
設置新的實驗參數並開始異常檢測分析
</p>

<div className="space-y-4">
<div className="space-y-2">
<Label htmlFor="experiment-name">實驗名稱</Label>
<Input
id="experiment-name"
value={newExperimentName}
onChange={(e) => setNewExperimentName(e.target.value)}
placeholder="輸入實驗名稱"
/>
</div>
<div className="space-y-2">
<Label htmlFor="experiment-description">實驗描述</Label>
<Textarea
id="experiment-description"
value={newExperimentDescription}
onChange={(e) => setNewExperimentDescription(e.target.value)}
placeholder="輸入實驗描述（可選）"
rows={3}
/>
</div>
</div>

<div className="flex justify-end gap-2 mt-6">
<Button
variant="outline"
onClick={() => setShowCreateModal(false)}
disabled={isCreating}
>
取消
</Button>
<Button
onClick={createExperiment}
disabled={!newExperimentName.trim() || isCreating}
>
{isCreating ? (
<>
<Loader2 className="h-4 w-4 mr-2 animate-spin" />
創建中...
</>
) : (
<>
<Plus className="h-4 w-4 mr-2" />
創建實驗
</>
)}
</Button>
</div>
</div>
</SimpleModal>
</div>
);
}
