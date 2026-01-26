"use client";

import React from "react";
import { LuLoader as Loader2 } from "react-icons/lu"; // Ensure you have lucide-react installed

interface LoaderProps {
    height?: string;
}

const LoaderPlaceholder: React.FC<LoaderProps> = ({ height = "100px" }) => {
    return (
        <div
            className="flex items-center justify-center w-full"
            style={{ height }}
        >
            <Loader2 className="animate-spin" />
        </div>
    );
};

export default LoaderPlaceholder;
