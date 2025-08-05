import * as d3 from "d3";
import type { DataPoint, LearningMode } from "./DatasetGenerator";
import { DatasetGenerator } from "./DatasetGenerator";

/**
 * SVG渲染器類
 * 負責所有視覺化的繪製和動畫
 */
export class SVGRenderer {
	private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
	private width: number;
	private height: number;
	private margin: number;
	private xScale: d3.ScaleLinear<number, number>;
	private yScale: d3.ScaleLinear<number, number>;

	constructor(
		svgElement: SVGSVGElement,
		width = 800,
		height = 600,
		margin = 50,
	) {
		this.svg = d3.select(svgElement);
		this.width = width;
		this.height = height;
		this.margin = margin;

		// 設定比例尺
		this.xScale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([margin, width - margin]);

		this.yScale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([height - margin, margin]);

		this.setupBasicElements();
	}

	/**
	 * 設置基本的SVG元素（網格、座標軸等）
	 */
	private setupBasicElements(): void {
		console.log("[SVGRenderer] Setting up basic elements");
		// 清空SVG
		this.svg.selectAll("*").remove();
		console.log("[SVGRenderer] Cleared SVG contents");

		// 繪製網格背景
		this.drawGrid();
		console.log("[SVGRenderer] Grid drawn");

		// 繪製座標軸
		this.drawAxes();
		console.log("[SVGRenderer] Axes drawn");
	}

	/**
	 * 繪製網格背景
	 */
	private drawGrid(): void {
		const gridGroup = this.svg.append("g").attr("class", "grid");

		// X軸網格線
		gridGroup
			.selectAll(".grid-x")
			.data(d3.range(0, 1.1, 0.1))
			.enter()
			.append("line")
			.attr("class", "grid-x")
			.attr("x1", (d) => this.xScale(d))
			.attr("x2", (d) => this.xScale(d))
			.attr("y1", this.margin)
			.attr("y2", this.height - this.margin)
			.attr("stroke", "#e0e0e0")
			.attr("stroke-width", 0.5);

		// Y軸網格線
		gridGroup
			.selectAll(".grid-y")
			.data(d3.range(0, 1.1, 0.1))
			.enter()
			.append("line")
			.attr("class", "grid-y")
			.attr("x1", this.margin)
			.attr("x2", this.width - this.margin)
			.attr("y1", (d) => this.yScale(d))
			.attr("y2", (d) => this.yScale(d))
			.attr("stroke", "#e0e0e0")
			.attr("stroke-width", 0.5);
	}

	/**
	 * 繪製座標軸
	 */
	private drawAxes(): void {
		const axisGroup = this.svg.append("g").attr("class", "axes");

		// X軸
		axisGroup
			.append("g")
			.attr("transform", `translate(0, ${this.height - this.margin})`)
			.call(d3.axisBottom(this.xScale).ticks(5));

		// Y軸
		axisGroup
			.append("g")
			.attr("transform", `translate(${this.margin}, 0)`)
			.call(d3.axisLeft(this.yScale).ticks(5));

		// 軸標籤
		axisGroup
			.append("text")
			.attr("x", this.width / 2)
			.attr("y", this.height - 10)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("fill", "#666")
			.text("特徵 X (Feature X)");

		axisGroup
			.append("text")
			.attr("transform", "rotate(-90)")
			.attr("x", -this.height / 2)
			.attr("y", 20)
			.attr("text-anchor", "middle")
			.style("font-size", "14px")
			.style("fill", "#666")
			.text("特徵 Y (Feature Y)");
	}

	/**
	 * 渲染數據點
	 */
	public renderDataPoints(
		dataPoints: DataPoint[],
		mode: LearningMode,
		showMisclassified = false,
		misclassifiedPoints: DataPoint[] = [],
	): void {
		console.log(
			"[SVGRenderer] renderDataPoints called with",
			dataPoints.length,
			"points. Mode:",
			mode,
		);

		// 檢查 svg 元素是否存在
		if (!this.svg.node()) {
			console.error("[SVGRenderer] SVG element is null or undefined");
			return;
		}

		console.log("[SVGRenderer] SVG element exists:", this.svg.node());

		// 只在第一次或需要時重新創建基本元素
		if (!this.svg.select(".grid").size()) {
			console.log(
				"[SVGRenderer] Recreating basic elements before rendering data points",
			);
			this.setupBasicElements();
		}

		// 清除舊的點，但要小心操作
		const oldPoints = this.svg.selectAll(".data-point");
		console.log(
			`[SVGRenderer] Found ${oldPoints.size()} existing data points`,
		);

		oldPoints.remove();
		console.log("[SVGRenderer] Cleared old data points");

		// 創建數據點層，確保在最上層
		this.svg.select(".points-layer").remove();
		console.log("[SVGRenderer] Creating new points layer");
		const pointsLayer = this.svg.append("g").attr("class", "points-layer");

		// 渲染新的數據點
		const circles = pointsLayer
			.selectAll(".data-point")
			.data(dataPoints)
			.enter()
			.append("circle")
			.attr("class", "data-point")
			.attr("cx", (d) => this.xScale(d.x))
			.attr("cy", (d) => this.yScale(d.y))
			.attr("r", 5)
			.style("fill", (d) => this.getPointColor(d, mode))
			.style("stroke", (d) => this.getPointColor(d, mode))
			.style("stroke-width", 1.5)
			.style("opacity", 0);

		console.log(
			`[SVGRenderer] Created ${circles.size()} new circle elements.`,
		);

		if (circles.size() === 0) {
			console.error(
				"[SVGRenderer] No circles were created. Check D3 data binding.",
			);
		} else {
			// 延長過渡時間，確保動畫效果更明顯
			circles.transition().duration(1000).style("opacity", 1);
			console.log("[SVGRenderer] Initiated transition for opacity.");
		}

		// 根據模式添加特殊效果
		if (mode === "CLL") {
			this.renderCLLProbabilityCharts(pointsLayer, dataPoints);
		}

		// 添加懸停效果
		circles
			.on("mouseover", (event, d) => {
				this.showTooltip(event, d, mode);
			})
			.on("mouseout", () => {
				this.hideTooltip();
			});

		// 在結果分析階段顯示錯誤標記
		console.log("[SVGRenderer] Error marker conditions:");
		console.log("  showMisclassified:", showMisclassified);
		console.log(
			"  misclassifiedPoints.length:",
			misclassifiedPoints.length,
		);

		if (showMisclassified && misclassifiedPoints.length > 0) {
			console.log(
				`[SVGRenderer] Rendering ${misclassifiedPoints.length} error markers`,
			);
			this.renderErrorMarkers(misclassifiedPoints);
		} else if (showMisclassified) {
			// 如果應該顯示錯誤但沒有錯誤點，清除錯誤標記
			console.log(
				"[SVGRenderer] Clearing error markers (no misclassified points)",
			);
			this.svg.selectAll(".error-markers").remove();
		} else {
			console.log(
				"[SVGRenderer] Not showing error markers (showMisclassified=false)",
			);
		}
	}

	/**
	 * 獲取數據點的顏色
	 */
	private getPointColor(point: DataPoint, mode: LearningMode): string {
		switch (mode) {
			case "PU":
				return this.getPUColor(point);
			case "PNU":
				return this.getPNUColor(point);
			case "CLL":
				return this.getCLLColor(point);
			default:
				return "#e0e0e0";
		}
	}

	/**
	 * PU學習模式的顏色邏輯
	 */
	private getPUColor(point: DataPoint): string {
		if (point.currentLabel === "P") {
			return "#4285f4"; // 深藍色 - 初始正樣本
		}
		if (point.currentLabel === "PP") {
			return "#87ceeb"; // 淺藍色 - AI預測為正樣本
		}
		if (point.currentLabel === "RN") {
			return "#9e9e9e"; // 灰色 - 可靠負樣本
		}
		if (point.currentLabel === "PN") {
			return "#e0e0e0"; // 淺灰色 - AI預測為負樣本
		}
		if (point.currentLabel === "U") {
			return "#e0e0e0"; // 淺灰色 - 未標記
		}
		return "#e0e0e0";
	}

	/**
	 * PNU學習模式的顏色邏輯
	 */
	private getPNUColor(point: DataPoint): string {
		if (point.isLabeled) {
			if (point.currentLabel === "α") {
				return "#4285f4"; // 藍色
			}
			if (point.currentLabel === "β") {
				return "#ea4335"; // 紅色
			}
		}

		// 根據概率混合顏色
		return DatasetGenerator.getColorFromProbabilities(point.probabilities);
	}

	/**
	 * CLL學習模式的顏色邏輯
	 * 根據規格書要求，實現機率分佈視覺化
	 */
	private getCLLColor(point: DataPoint): string {
		// 如果是初始狀態，顯示灰色
		if (point.animationPhase === 0) {
			return "#e0e0e0"; // 初始灰色
		}

		// 根據機率分佈混合顏色
		return DatasetGenerator.getColorFromProbabilities(point.probabilities);
	}

	/**
	 * 渲染錯誤標記
	 */
	private renderErrorMarkers(misclassifiedPoints: DataPoint[]): void {
		console.log(
			"[SVGRenderer.renderErrorMarkers] Called with",
			misclassifiedPoints.length,
			"points",
		);

		// 先清除舊的錯誤標記
		this.svg.selectAll(".error-markers").remove();
		console.log(
			"[SVGRenderer.renderErrorMarkers] Cleared old error markers",
		);

		// 創建新的錯誤標記組
		const errorGroup = this.svg.append("g").attr("class", "error-markers");
		console.log("[SVGRenderer.renderErrorMarkers] Created error group");

		const markers = errorGroup
			.selectAll(".error-marker")
			.data(misclassifiedPoints)
			.enter()
			.append("text")
			.attr("class", "error-marker")
			.attr("x", (d) => this.xScale(d.x))
			.attr("y", (d) => this.yScale(d.y) - 10)
			.attr("text-anchor", "middle")
			.style("font-size", "16px")
			.style("fill", "red")
			.style("font-weight", "bold")
			.text("❌");

		console.log(
			"[SVGRenderer.renderErrorMarkers] Created",
			markers.size(),
			"error markers",
		);
		console.log(
			"[SVGRenderer.renderErrorMarkers] Sample positions:",
			misclassifiedPoints.slice(0, 3).map((p) => ({
				x: p.x,
				y: p.y,
				screenX: this.xScale(p.x),
				screenY: this.yScale(p.y) - 10,
			})),
		);
	}

	/**
	 * 新增：為 CLL 模式渲染機率分佈餅圖
	 * 實現規格書要求的視覺效果
	 */
	private renderCLLProbabilityCharts(
		pointsLayer: d3.Selection<SVGGElement, unknown, null, undefined>,
		dataPoints: DataPoint[],
	): void {
		// 為每個點添加機率分佈餅圖（小圓圈）
		const chartRadius = 8;

		dataPoints.forEach((point) => {
			if (point.animationPhase === 0) {
				return; // 初始狀態不顯示
			}

			const chartGroup = pointsLayer
				.append("g")
				.attr("class", "probability-chart")
				.attr(
					"transform",
					`translate(${this.xScale(point.x)}, ${this.yScale(point.y)})`,
				);

			// 創建餅圖數據
			const pieData = [
				{ label: "α", value: point.probabilities.α, color: "#4285f4" },
				{ label: "β", value: point.probabilities.β, color: "#ea4335" },
				{ label: "γ", value: point.probabilities.γ, color: "#fbbc05" },
			].filter((d) => d.value > 0.01); // 只顯示概率大於1%的部分

			// 創建餅圖生成器
			const pie = d3
				.pie<{ label: string; value: number; color: string }>()
				.value((d) => d.value)
				.sort(null);

			const arc = d3
				.arc<
					d3.PieArcDatum<{
						label: string;
						value: number;
						color: string;
					}>
				>()
				.innerRadius(0)
				.outerRadius(chartRadius);

			// 繪製餅圖片段
			chartGroup
				.selectAll(".pie-segment")
				.data(pie(pieData))
				.enter()
				.append("path")
				.attr("class", "pie-segment")
				.attr("d", arc)
				.attr("fill", (d) => d.data.color)
				.attr("opacity", 0.8)
				.attr("stroke", "#fff")
				.attr("stroke-width", 1);
		});
	}

	/**
	 * 繪製PU學習的決策邊界
	 */
	public renderDecisionBoundary(
		boundaryData: {
			x1: number;
			y1: number;
			x2: number;
			y2: number;
		} | null,
	): void {
		// 移除舊的邊界線
		this.svg.selectAll(".decision-boundary").remove();

		if (!boundaryData) {
			return;
		}

		this.svg
			.append("line")
			.attr("class", "decision-boundary")
			.attr("x1", this.xScale(boundaryData.x1))
			.attr("y1", this.yScale(boundaryData.y1))
			.attr("x2", this.xScale(boundaryData.x2))
			.attr("y2", this.yScale(boundaryData.y2))
			.attr("stroke", "#ff9800")
			.attr("stroke-width", 3)
			.attr("stroke-dasharray", "5,5")
			.style("opacity", 0)
			.transition()
			.duration(1000)
			.style("opacity", 0.8);
	}

	/**
	 * 繪製PNU學習的傳播網絡
	 */
	public renderPropagationNetwork(
		edges: Array<{
			source: DataPoint;
			target: DataPoint;
			weight: number;
		}>,
	): void {
		// 移除舊的網絡線
		this.svg.selectAll(".propagation-network").remove();

		const networkGroup = this.svg
			.append("g")
			.attr("class", "propagation-network");

		networkGroup
			.selectAll(".propagation-edge")
			.data(edges)
			.enter()
			.append("line")
			.attr("class", "propagation-edge")
			.attr("x1", (d) => this.xScale(d.source.x))
			.attr("y1", (d) => this.yScale(d.source.y))
			.attr("x2", (d) => this.xScale(d.target.x))
			.attr("y2", (d) => this.yScale(d.target.y))
			.attr("stroke", "#2196f3")
			.attr("stroke-width", (d) => Math.max(0.5, d.weight * 3))
			.attr("stroke-opacity", (d) => d.weight * 0.6)
			.style("opacity", 0)
			.transition()
			.duration(500)
			.style("opacity", 1);
	}

	/**
	 * 繪製CLL學習的影響網絡
	 */
	public renderInfluenceNetwork(
		edges: Array<{
			source: DataPoint;
			target: DataPoint;
			influence: number;
		}>,
		excludeLabel: string,
	): void {
		// 移除舊的影響線
		this.svg.selectAll(".influence-network").remove();

		const networkGroup = this.svg
			.append("g")
			.attr("class", "influence-network");

		// 繪製影響線
		networkGroup
			.selectAll(".influence-edge")
			.data(edges)
			.enter()
			.append("line")
			.attr("class", "influence-edge")
			.attr("x1", (d) => this.xScale(d.source.x))
			.attr("y1", (d) => this.yScale(d.source.y))
			.attr("x2", (d) => this.xScale(d.target.x))
			.attr("y2", (d) => this.yScale(d.target.y))
			.attr("stroke", "#f44336")
			.attr("stroke-width", (d) => Math.max(0.5, d.influence * 4))
			.attr("stroke-opacity", (d) => d.influence * 0.8)
			.attr("stroke-dasharray", "3,3")
			.style("opacity", 0)
			.transition()
			.duration(800)
			.style("opacity", 1);

		// 添加排除標籤文字
		if (edges.length > 0) {
			networkGroup
				.append("text")
				.attr("x", this.xScale(edges[0].source.x))
				.attr("y", this.yScale(edges[0].source.y) - 15)
				.attr("text-anchor", "middle")
				.style("font-size", "12px")
				.style("fill", "#f44336")
				.style("font-weight", "bold")
				.text(`🚫${excludeLabel}`)
				.style("opacity", 0)
				.transition()
				.duration(500)
				.style("opacity", 1);
		}
	}

	/**
	 * 添加動畫效果
	 */
	public animatePointTransition(
		newPoints: DataPoint[],
		mode: LearningMode,
		duration = 1000,
	): void {
		const circles = this.svg.selectAll(".points circle");

		circles
			.data(newPoints)
			.transition()
			.duration(duration)
			.attr("fill", (d) => this.getPointColor(d, mode))
			.attr("r", (d) => {
				// 根據動畫階段調整大小
				if (d.animationPhase && d.animationPhase > 0) {
					return 8; // 放大正在處理的點
				}
				return 6;
			});
	}

	/**
	 * 顯示工具提示
	 */
	private showTooltip(
		_event: MouseEvent,
		point: DataPoint,
		mode: LearningMode,
	): void {
		// 移除舊的提示
		this.svg.selectAll(".tooltip").remove();

		const tooltip = this.svg.append("g").attr("class", "tooltip");

		// 提示框背景
		const rect = tooltip
			.append("rect")
			.attr("x", this.xScale(point.x) + 10)
			.attr("y", this.yScale(point.y) - 40)
			.attr("width", 180)
			.attr("height", 60)
			.attr("fill", "rgba(0, 0, 0, 0.8)")
			.attr("rx", 5);

		// 提示文字
		const text = tooltip
			.append("text")
			.attr("x", this.xScale(point.x) + 15)
			.attr("y", this.yScale(point.y) - 25)
			.style("fill", "white")
			.style("font-size", "12px");

		text.append("tspan")
			.attr("x", this.xScale(point.x) + 15)
			.attr("dy", "0")
			.text(`ID: ${point.id}`);

		text.append("tspan")
			.attr("x", this.xScale(point.x) + 15)
			.attr("dy", "15")
			.text(
				`真實: ${point.trueLabel} | 當前: ${point.currentLabel || "未知"}`,
			);

		if (mode === "PNU" || mode === "CLL") {
			text.append("tspan")
				.attr("x", this.xScale(point.x) + 15)
				.attr("dy", "15")
				.text(
					`概率: α:${point.probabilities.α.toFixed(2)} β:${point.probabilities.β.toFixed(2)} γ:${point.probabilities.γ.toFixed(2)}`,
				);
		}
	}

	/**
	 * 突出顯示錯誤分類的點
	 */
	public highlightMisclassifiedPoints(
		misclassifiedPoints: DataPoint[],
	): void {
		this.renderErrorMarkers(misclassifiedPoints);
	}

	/**
	 * 動畫：顯示正樣本質心
	 */
	public animateCentroid(
		centroid: { x: number; y: number },
		positivePoints: DataPoint[],
	): void {
		// 移除舊的質心
		this.svg.selectAll(".centroid-marker").remove();

		// 閃爍正樣本點
		this.svg
			.selectAll("circle")
			.filter((d: any) => positivePoints.includes(d))
			.transition()
			.duration(250)
			.attr("r", 8)
			.attr("fill", "#87ceeb")
			.transition()
			.duration(250)
			.attr("r", 6)
			.attr("fill", "#4285f4");

		// 顯示質心十字
		const centroidGroup = this.svg
			.append("g")
			.attr("class", "centroid-marker")
			.attr(
				"transform",
				`translate(${this.xScale(centroid.x)}, ${this.yScale(
					centroid.y,
				)})`,
			)
			.attr("opacity", 0);

		centroidGroup
			.append("line")
			.attr("x1", -10)
			.attr("x2", 10)
			.attr("y1", 0)
			.attr("y2", 0)
			.attr("stroke", "#ff9800")
			.attr("stroke-width", 2);

		centroidGroup
			.append("line")
			.attr("x1", 0)
			.attr("x2", 0)
			.attr("y1", -10)
			.attr("y2", 10)
			.attr("stroke", "#ff9800")
			.attr("stroke-width", 2);

		centroidGroup.transition().delay(500).duration(500).attr("opacity", 1);
	}

	/**
	 * 動畫：擴散圓以尋找RN
	 */
	public animateRNDetection(
		centroid: { x: number; y: number },
		radius: number,
	): void {
		const diffusionCircle = this.svg
			.append("circle")
			.attr("class", "diffusion-circle")
			.attr("cx", this.xScale(centroid.x))
			.attr("cy", this.yScale(centroid.y))
			.attr("r", 0)
			.attr("fill", "none")
			.attr("stroke", "#ff9800")
			.attr("stroke-width", 2);

		diffusionCircle
			.transition()
			.duration(1000)
			.attr("r", this.xScale(radius) - this.xScale(0))
			.transition()
			.duration(500)
			.attr("opacity", 0)
			.remove();
	}

	/**
	 * 動畫：SVM邊界訓練
	 */
	public animateSVMTraining(
		initialBoundary: { x1: number; y1: number; x2: number; y2: number },
		finalBoundary: { x1: number; y1: number; x2: number; y2: number },
	): void {
		this.svg.selectAll(".decision-boundary").remove();

		const boundary = this.svg
			.append("line")
			.attr("class", "decision-boundary")
			.attr("x1", this.xScale(initialBoundary.x1))
			.attr("y1", this.yScale(initialBoundary.y1))
			.attr("x2", this.xScale(initialBoundary.x2))
			.attr("y2", this.yScale(initialBoundary.y2))
			.attr("stroke", "#ff9800")
			.attr("stroke-width", 3)
			.attr("stroke-dasharray", "5,5");

		boundary
			.transition()
			.duration(1500)
			.attr("x1", this.xScale(finalBoundary.x1))
			.attr("y1", this.yScale(finalBoundary.y1))
			.attr("x2", this.xScale(finalBoundary.x2))
			.attr("y2", this.yScale(finalBoundary.y2));
	}

	/**
	 * 隱藏工具提示
	 */
	private hideTooltip(): void {
		this.svg.selectAll(".tooltip").remove();
	}

	/**
	 * 清除所有動態元素
	 */
	public clearDynamicElements(): void {
		console.log(
			"[SVGRenderer] Clearing dynamic elements only (not data points)",
		);
		this.svg.selectAll(".decision-boundary").remove();
		this.svg.selectAll(".propagation-network").remove();
		this.svg.selectAll(".influence-network").remove();
		this.svg.selectAll(".error-markers").remove();
		this.svg.selectAll(".tooltip").remove();
		this.svg.selectAll(".centroid-marker").remove();
		this.svg.selectAll(".diffusion-circle").remove();
	}

	/**
	 * 重置渲染器
	 */
	public reset(): void {
		this.setupBasicElements();
	}

	/**
	 * 獲取SVG元素（用於導出等）
	 */
	public getSVGElement(): SVGSVGElement | null {
		return this.svg.node();
	}
}
