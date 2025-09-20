import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Risk Estimation in Practice",
	description:
		"From Unbiased Theory to Real-World Deployment: An AI-Powered Testbed",
	openGraph: {
		title: "Risk Estimation in Practice",
		description:
			"From Unbiased Theory to Real-World Deployment: An AI-Powered Testbed",
		siteName: "Risk Estimation in Practice",
	},
	twitter: {
		card: "summary_large_image",
		title: "Risk Estimation in Practice",
		description:
			"From Unbiased Theory to Real-World Deployment: An AI-Powered Testbed",
	},
};

export default function RootLayout({
	children,
}: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap"
					rel="stylesheet"
				/>
				<link rel="icon" href="/favicon.png" sizes="32x32" />
			</head>
			<body className={inter.className}>
				<Providers>
					<NuqsAdapter>
						<Navbar />
						<main>{children}</main>
						<Footer />
						<Toaster />
					</NuqsAdapter>
				</Providers>
			</body>
		</html>
	);
}
