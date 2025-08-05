"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Activity,
	ArrowRight,
	Atom,
	BarChart3,
	BookOpen,
	Bot,
	Brain,
	Camera,
	Cpu,
	Eye,
	FlaskConical,
	Gamepad2,
	GitBranch,
	Image,
	Layers,
	Lightbulb,
	type LucideIcon,
	MessageSquare,
	Mic,
	Microscope,
	Network,
	Palette,
	PenTool,
	Settings,
	Sparkles,
	Target,
	TreePine,
	TrendingUp,
	Zap,
} from "lucide-react";
import Link from "next/link";

interface FeatureCardData {
	icon: LucideIcon;
	title: string;
	description: string;
	href: string;
	difficulty: string;
	tags: string[];
	color: string;
	academicValue: string;
	isHighlight?: boolean;
	isNew?: boolean;
}

export default function HomePage() {
	// 板塊一：核心技術實作 (Core Technology Implementation)
	const coreImplementation = [
		{
			icon: BarChart3,
			title: "線性回歸",
			description:
				"從零開始實現線性回歸演算法，展現基礎機器學習的工程實力",
			href: "/linear-regression",
			difficulty: "基礎",
			tags: ["機器學習", "數學基礎", "PyTorch"],
			color: "bg-blue-500",
			academicValue: "證明我能獨立實現經典演算法",
		},
		{
			icon: Brain,
			title: "神經網路分類",
			description: "多層感知機的完整實現，包含前向傳播與反向傳播機制",
			href: "/neural-network",
			difficulty: "中級",
			tags: ["深度學習", "分類", "FastAPI"],
			color: "bg-purple-500",
			academicValue: "展現對神經網路核心原理的掌握",
		},
		{
			icon: MessageSquare,
			title: "情感分析系統",
			description: "基於 RNN/LSTM 的文本情感分析，完整的 NLP 流水線實現",
			href: "/sentiment",
			difficulty: "中級",
			tags: ["NLP", "文字分析", "RNN"],
			color: "bg-green-500",
			academicValue: "證明自然語言處理的工程能力",
		},
		{
			icon: Image,
			title: "圖片分類器",
			description: "CNN 圖像分類系統，從資料前處理到模型部署的完整實現",
			href: "/image-classifier",
			difficulty: "中級",
			tags: ["電腦視覺", "CNN", "影像識別"],
			color: "bg-orange-500",
			academicValue: "展現計算機視覺的端到端實現能力",
		},
		{
			icon: PenTool,
			title: "AI 塗鴉識別",
			description: "即時手寫識別系統，結合前端互動與後端深度學習模型",
			href: "/doodle-recognition",
			difficulty: "中級",
			tags: ["圖像識別", "即時推理", "互動系統"],
			color: "bg-rose-500",
			academicValue: "證明即時 AI 系統的開發能力",
		},
		{
			icon: Target,
			title: "Quick Draw AI",
			description:
				"Google Quick Draw 風格的即時塗鴉識別遊戲，20秒挑戰模式",
			href: "/quickdraw",
			difficulty: "中級",
			tags: ["即時識別", "遊戲化", "Quick Draw"],
			color: "bg-yellow-500",
			academicValue: "展現遊戲化 AI 系統的開發能力",
			isNew: true,
		},
	];

	// 板塊二：互動式原理剖析 (Interactive Principle Analysis)
	const principleAnalysis = [
		{
			icon: Network,
			title: "神經網路視覺化",
			description:
				"逐層展示神經網路的內部運作，理解權重更新與特徵學習過程",
			href: "/neural-network-visualization",
			difficulty: "進階",
			tags: ["視覺化", "神經網路", "可解釋AI"],
			color: "bg-indigo-500",
			academicValue: "展現對模型內部機制的深度理解",
		},
		{
			icon: Layers,
			title: "CNN 架構剖析",
			description: "卷積神經網路的層級結構分析，視覺化特徵提取過程",
			href: "/cnn-visualization",
			difficulty: "進階",
			tags: ["CNN", "特徵視覺化", "架構分析"],
			color: "bg-cyan-500",
			academicValue: "證明對深度學習架構的深刻理解",
		},
		{
			icon: TrendingUp,
			title: "梯度下降演示",
			description: "互動式梯度下降過程，理解優化演算法的收斂行為",
			href: "/gradient-descent",
			difficulty: "進階",
			tags: ["優化理論", "梯度下降", "數學視覺化"],
			color: "bg-emerald-500",
			academicValue: "展現對優化理論的數學理解",
		},
		{
			icon: GitBranch,
			title: "反向傳播機制",
			description: "詳細展示梯度如何在神經網路中反向傳播，理解學習的本質",
			href: "/back-propagation",
			difficulty: "進階",
			tags: ["反向傳播", "梯度計算", "學習理論"],
			color: "bg-violet-500",
			academicValue: "證明對深度學習核心演算法的掌握",
		},
		{
			icon: Zap,
			title: "反向傳播與梯度下降整合",
			description:
				"完整展示神經網路訓練的核心：如何結合反向傳播和梯度下降來優化參數",
			href: "/backprop-gradient-integrated",
			difficulty: "進階",
			tags: ["反向傳播", "梯度下降", "參數優化", "整合學習"],
			color: "bg-pink-500",
			academicValue: "深度理解神經網路訓練的完整機制",
			isHighlight: true,
			isNew: true,
		},
		{
			icon: Target,
			title: "注意力機制視覺化",
			description: "展示 Transformer 注意力權重，理解現代 AI 的核心技術",
			href: "/attention-mechanism",
			difficulty: "進階",
			tags: ["Transformer", "注意力機制", "現代AI"],
			color: "bg-amber-500",
			academicValue: "展現對前沿技術的深度理解（重點推薦）",
			isHighlight: true,
		},
		{
			icon: Activity,
			title: "Transformer 架構",
			description:
				"完整的 Transformer 模型視覺化，從編碼器到解碼器的全流程",
			href: "/transformer-visualization",
			difficulty: "進階",
			tags: ["Transformer", "序列建模", "NLP"],
			color: "bg-red-500",
			academicValue: "證明對現代 NLP 核心技術的理解",
		},
		{
			icon: Cpu,
			title: "RNN 序列建模",
			description: "循環神經網路的時序處理機制，理解序列資料的學習過程",
			href: "/rnn-visualization",
			difficulty: "進階",
			tags: ["RNN", "LSTM", "序列建模"],
			color: "bg-teal-500",
			academicValue: "展現對序列學習理論的理解",
		},
	];

	// 板塊三：前沿研究探索 (Frontier Research Exploration)
	const frontierResearch = [
		{
			icon: FlaskConical,
			title: "互動式模型訓練",
			description:
				"可控的科學實驗平台：自訂超參數、損失函數，即時觀察訓練過程",
			href: "/model-training",
			difficulty: "研究級",
			tags: ["模型訓練", "超參數調優", "實驗設計"],
			color: "bg-red-600",
			academicValue: "展現研究實驗設計能力（核心展示）",
			isHighlight: true,
		},
		{
			icon: Microscope,
			title: "弱監督學習挑戰",
			description:
				"探索 PU Learning 與互補標籤學習，直接對應杉山教授的研究領域",
			href: "/weak-supervision-challenge",
			difficulty: "研究級",
			tags: ["弱監督學習", "PU Learning", "前沿研究"],
			color: "bg-purple-600",
			academicValue: "直接展現博士研究方向的技術實力",
			isHighlight: true,
			isNew: true,
		},
		{
			icon: TreePine,
			title: "決策樹解釋性",
			description: "可解釋 AI 的經典案例，展示決策過程的透明化",
			href: "/decision-tree",
			difficulty: "研究級",
			tags: ["可解釋AI", "決策樹", "機器學習"],
			color: "bg-green-600",
			academicValue: "展現對可解釋性研究的理解",
		},
		{
			icon: Sparkles,
			title: "GAN 生成對抗",
			description: "生成對抗網路的訓練動態，理解生成模型的對抗學習機制",
			href: "/gan-visualization",
			difficulty: "研究級",
			tags: ["GAN", "生成模型", "對抗學習"],
			color: "bg-pink-600",
			academicValue: "證明對前沿生成技術的理解",
		},
		{
			icon: Brain,
			title: "大型語言模型",
			description: "探索 LLM 的內部機制，理解大規模語言模型的工作原理",
			href: "/large-language-model",
			difficulty: "研究級",
			tags: ["LLM", "GPT", "大型模型"],
			color: "bg-slate-600",
			academicValue: "展現對前沿 AI 技術的追蹤能力",
		},
		{
			icon: Palette,
			title: "Stable Diffusion",
			description: "擴散模型的生成過程視覺化，理解現代圖像生成的核心技術",
			href: "/stable-diffusion",
			difficulty: "研究級",
			tags: ["擴散模型", "圖像生成", "AIGC"],
			color: "bg-indigo-600",
			academicValue: "證明對最新生成技術的理解",
		},
	];

	// 板塊四：創意互動體驗 (Creative Interactive Experience)
	const creativeInteraction = [
		{
			icon: Palette,
			title: "風格轉換藝術",
			description: "神經風格轉換技術，將照片轉換為藝術作品",
			href: "/style-transfer",
			difficulty: "體驗",
			tags: ["風格轉換", "藝術創作", "圖像處理"],
			color: "bg-pink-500",
			academicValue: "展現 AI 在創意領域的應用",
		},
		{
			icon: Mic,
			title: "語音轉文字",
			description: "即時語音識別系統，展現多模態 AI 技術",
			href: "/speech-to-text",
			difficulty: "體驗",
			tags: ["語音識別", "多模態AI", "即時處理"],
			color: "bg-cyan-500",
			academicValue: "證明多模態系統開發能力",
		},
		{
			icon: Bot,
			title: "AI 聊天機器人",
			description: "智能對話系統，展現自然語言理解與生成能力",
			href: "/chatbot",
			difficulty: "體驗",
			tags: ["對話系統", "自然語言", "ChatBot"],
			color: "bg-emerald-500",
			academicValue: "展現對話系統的工程實現",
		},
		{
			icon: BookOpen,
			title: "AI 故事生成",
			description: "創意文本生成系統，展現 AI 的創作能力",
			href: "/story-generator",
			difficulty: "體驗",
			tags: ["文字生成", "創意寫作", "NLG"],
			color: "bg-amber-500",
			academicValue: "展現生成式 AI 的應用能力",
		},
		{
			icon: Camera,
			title: "物體分割識別",
			description: "Segment Anything 模型應用，展現前沿的電腦視覺技術",
			href: "/segment-anything",
			difficulty: "體驗",
			tags: ["物體分割", "電腦視覺", "前沿技術"],
			color: "bg-blue-500",
			academicValue: "展現對前沿視覺技術的應用",
		},
		{
			icon: Eye,
			title: "Vision Transformer",
			description: "視覺 Transformer 的圖像分類應用",
			href: "/vision-transformer",
			difficulty: "體驗",
			tags: ["ViT", "Transformer", "視覺AI"],
			color: "bg-purple-500",
			academicValue: "展現對 Transformer 在視覺領域的理解",
		},
		{
			icon: Atom,
			title: "CLIP 多模態",
			description: "文字與圖像的跨模態理解技術",
			href: "/clip-multimodal",
			difficulty: "體驗",
			tags: ["CLIP", "多模態", "跨模態學習"],
			color: "bg-green-500",
			academicValue: "展現多模態 AI 的理解",
		},
		{
			icon: Lightbulb,
			title: "Neural Radiance Fields",
			description: "3D 場景重建技術，展現 AI 在 3D 視覺的突破",
			href: "/neural-radiance-fields",
			difficulty: "體驗",
			tags: ["NeRF", "3D重建", "計算機圖學"],
			color: "bg-indigo-500",
			academicValue: "展現對前沿 3D AI 技術的了解",
		},
		{
			icon: Gamepad2,
			title: "貪食蛇 AI 訓練",
			description:
				"觀察 Q-Learning 強化學習演算法如何訓練 AI 玩貪食蛇遊戲",
			href: "/games/snake",
			difficulty: "體驗",
			tags: ["強化學習", "Q-Learning", "遊戲AI"],
			color: "bg-green-600",
			academicValue: "展現強化學習在遊戲中的應用",
			isNew: true,
		},
	];

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "基礎":
			case "體驗":
				return "bg-green-100 text-green-800";
			case "中級":
				return "bg-blue-100 text-blue-800";
			case "進階":
				return "bg-orange-100 text-orange-800";
			case "研究級":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const FeatureCard = ({ feature }: { feature: FeatureCardData }) => (
		<Card
			className={`group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
				feature.isHighlight ? "ring-2 ring-yellow-400 shadow-md" : ""
			}`}
		>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div
						className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white mb-3`}
					>
						<feature.icon className="h-6 w-6" />
					</div>
					<div className="flex gap-2 flex-col items-end">
						<div className="flex gap-2">
							{feature.isNew && (
								<Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
									NEW
								</Badge>
							)}
							{feature.isHighlight && (
								<Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
									重點
								</Badge>
							)}
						</div>
						<Badge
							className={getDifficultyColor(feature.difficulty)}
						>
							{feature.difficulty}
						</Badge>
					</div>
				</div>
				<CardTitle className="group-hover:text-blue-600 transition-colors">
					{feature.title}
				</CardTitle>
				<CardDescription className="text-sm leading-relaxed">
					{feature.description}
				</CardDescription>
				{feature.academicValue && (
					<div className="mt-2 p-2 bg-blue-50 rounded-lg">
						<p className="text-xs text-blue-700 font-medium">
							學術價值：{feature.academicValue}
						</p>
					</div>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-1 mb-4">
					{feature.tags.map((tag: string) => (
						<Badge
							key={tag}
							variant="secondary"
							className="text-xs"
						>
							{tag}
						</Badge>
					))}
				</div>
				<Button
					asChild
					className="w-full group-hover:bg-blue-600 transition-colors"
				>
					<Link href={feature.href}>立即體驗</Link>
				</Button>
			</CardContent>
		</Card>
	);

	return (
		<div className="container mx-auto px-4 py-12">
			{/* Hero Section */}
			<div className="text-center mb-16">
				<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-8">
					<Brain className="h-10 w-10" />
				</div>
				<h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					AI 研究展示平台
				</h1>
				<p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
					從基礎演算法到前沿研究的完整展示。這是一個為學術研究設計的互動式平台，
					展現從工程實作到研究創新的全方位 AI 技術能力。
				</p>
				<div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-8">
					<div className="flex items-center gap-2">
						<Settings className="h-4 w-4" />
						<span>後端：PyTorch + FastAPI</span>
					</div>
					<div className="flex items-center gap-2">
						<Layers className="h-4 w-4" />
						<span>前端：Next.js + TypeScript</span>
					</div>
					<div className="flex items-center gap-2">
						<Zap className="h-4 w-4" />
						<span>完整開源實現</span>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Button size="lg" className="text-lg px-8" asChild>
						<Link href="/linear-regression">
							從基礎開始
							<ArrowRight className="ml-2 h-5 w-5" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="text-lg px-8"
						asChild
					>
						<Link href="/attention-mechanism">查看核心技術</Link>
					</Button>
				</div>
			</div>

			{/* Strategy Explanation */}
			<div className="mb-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
				<h2 className="text-2xl font-bold mb-4 text-center">
					平台設計理念
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="text-center">
						<div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<Settings className="h-8 w-8 text-white" />
						</div>
						<h3 className="font-semibold mb-2">工程實力證明</h3>
						<p className="text-sm text-muted-foreground">
							從零開始實現經典演算法，展現端到端的 AI 系統開發能力
						</p>
					</div>
					<div className="text-center">
						<div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<Eye className="h-8 w-8 text-white" />
						</div>
						<h3 className="font-semibold mb-2">學術深度展現</h3>
						<p className="text-sm text-muted-foreground">
							深度剖析 AI 模型內部機制，展現研究者的理論理解能力
						</p>
					</div>
					<div className="text-center">
						<div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<Lightbulb className="h-8 w-8 text-white" />
						</div>
						<h3 className="font-semibold mb-2">研究潛力體現</h3>
						<p className="text-sm text-muted-foreground">
							探索前沿技術與研究方向，展現創新思維與學術追求
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<Tabs defaultValue="core" className="w-full">
				<TabsList className="grid w-full grid-cols-4 mb-12">
					<TabsTrigger value="core" className="text-sm">
						<Settings className="h-4 w-4 mr-2" />
						核心技術實作
					</TabsTrigger>
					<TabsTrigger value="principle" className="text-sm">
						<Eye className="h-4 w-4 mr-2" />
						互動式原理剖析
					</TabsTrigger>
					<TabsTrigger value="research" className="text-sm">
						<Lightbulb className="h-4 w-4 mr-2" />
						前沿研究探索
					</TabsTrigger>
					<TabsTrigger value="creative" className="text-sm">
						<Gamepad2 className="h-4 w-4 mr-2" />
						創意互動體驗
					</TabsTrigger>
				</TabsList>

				<TabsContent value="core">
					<div className="mb-8">
						<h2 className="text-3xl font-bold mb-4">
							核心技術實作
						</h2>
						<p className="text-muted-foreground mb-6 text-lg">
							證明「我能建構一個完整的 AI 系統」—— 從演算法實現到
							API 部署的完整工程能力展示
						</p>
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-amber-800 mb-2">
								🎯 學術價值
							</h4>
							<p className="text-amber-700 text-sm">
								展現紮實的工程基礎，證明具備從理論到實踐的完整能力。這是所有後續亮點的基石，
								展現您是一個可靠的研究工程師。
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{coreImplementation.map((feature) => (
							<FeatureCard key={feature.href} feature={feature} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="principle">
					<div className="mb-8">
						<h2 className="text-3xl font-bold mb-4">
							互動式原理剖析
						</h2>
						<p className="text-muted-foreground mb-6 text-lg">
							證明「我不只會調用，我懂底層原理」—— 展現對 AI
							模型內部運作機制的深刻理解
						</p>
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-blue-800 mb-2">
								🎯 學術價值
							</h4>
							<p className="text-blue-700 text-sm">
								從「使用者」進化為「研究者」，展現博士生所需的研究型思維。特別是注意力機制視覺化，
								這是現代 AI 的核心技術，能極大地吸引教授的注意。
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{principleAnalysis.map((feature) => (
							<FeatureCard key={feature.href} feature={feature} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="research">
					<div className="mb-8">
						<h2 className="text-3xl font-bold mb-4">
							前沿研究探索
						</h2>
						<p className="text-muted-foreground mb-6 text-lg">
							證明「我具備研究潛力」——
							展現將前沿理論轉化為研究工具的能力，為博士研究做準備
						</p>
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-red-800 mb-2">
								🎯 學術價值
							</h4>
							<p className="text-red-700 text-sm">
								這是您研究潛力的最強證明！特別是「弱監督學習挑戰」直接對應杉山教授的研究領域，
								「互動式模型訓練」展現您的實驗設計能力，這些都是申請博士班的核心亮點。
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{frontierResearch.map((feature) => (
							<FeatureCard key={feature.href} feature={feature} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="creative">
					<div className="mb-8">
						<h2 className="text-3xl font-bold mb-4">
							創意互動體驗
						</h2>
						<p className="text-muted-foreground mb-6 text-lg">
							展現「AI 技術的創新應用」——
							從實用功能到前沿技術的多元化展示
						</p>
						<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-green-800 mb-2">
								🎯 學術價值
							</h4>
							<p className="text-green-700 text-sm">
								展現您對 AI
								技術廣度的掌握和創新應用的思維。這些項目展現您緊跟前沿技術發展，
								具備將理論轉化為實際應用的能力。
							</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{creativeInteraction.map((feature) => (
							<FeatureCard key={feature.href} feature={feature} />
						))}
					</div>
				</TabsContent>
			</Tabs>

			{/* Call to Action */}
			<div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-12">
				<h2 className="text-3xl font-bold mb-4">
					開始探索 AI 的無限可能
				</h2>
				<p className="text-xl mb-8 opacity-90">
					每個模組都是一個完整的學習體驗，從基礎概念到前沿研究，循序漸進地建構您的
					AI 知識體系
				</p>
				<div className="flex flex-wrap justify-center gap-4">
					<Button size="lg" variant="secondary" asChild>
						<Link href="/linear-regression">從基礎開始</Link>
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="text-white border-white hover:bg-white hover:text-blue-600"
						asChild
					>
						<Link href="/attention-mechanism">查看核心技術</Link>
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="text-white border-white hover:bg-white hover:text-purple-600"
						asChild
					>
						<Link href="/model-training">探索研究功能</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
