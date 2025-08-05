import React from "react";

const Separator: React.FC<{ className?: string }> = ({ className }) => (
	<div className={`h-[1px] w-full bg-border ${className || ""}`} />
);

export default Separator;
