"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";

interface LaTeXProps {
	children: string;
	className?: string;
	displayMode?: boolean;
}

export function LaTeX({
	children,
	className = "",
	displayMode = false,
}: LaTeXProps) {
	const containerRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (containerRef.current) {
			try {
				katex.render(children, containerRef.current, {
					displayMode,
					throwOnError: false,
					strict: false,
				});
			} catch (error) {
				console.error("KaTeX rendering error:", error);
				// 如果渲染失敗，顯示原始文本
				if (containerRef.current) {
					containerRef.current.textContent = children;
				}
			}
		}
	}, [children, displayMode]);

	return <span ref={containerRef} className={className} />;
}
