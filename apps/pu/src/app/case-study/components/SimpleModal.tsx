import React from "react";

interface SimpleModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
}) => {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold">{title}</h3>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="關閉對話框"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				{children}
			</div>
		</div>
	);
};
