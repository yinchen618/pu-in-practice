import type {
	Config,
	Data,
	Layout,
	PlotlyHTMLElement,
} from "plotly.js-basic-dist";

export interface PlotlyAPI {
	newPlot: (
		graphDiv: HTMLElement,
		data: Data[],
		layout?: Partial<Layout>,
		config?: Partial<Config>,
	) => Promise<PlotlyHTMLElement>;
	purge: (graphDiv: HTMLElement) => void;
}

declare global {
	interface Window {
		Plotly?: PlotlyAPI;
	}
}
