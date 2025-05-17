"use client";

import ApiKeyContext from "@app/contexts/apiKeyContext";
import { GetApiKeyResponse } from "@server/routers/apiKeys";
import { useState } from "react";

interface ApiKeyProviderProps {
    children: React.ReactNode;
    apiKey: GetApiKeyResponse;
}

export function ApiKeyProvider({ children, apiKey: ak }: ApiKeyProviderProps) {
    const [apiKey, setApiKey] = useState<GetApiKeyResponse>(ak);

    const updateApiKey = (updatedApiKey: Partial<GetApiKeyResponse>) => {
        if (!apiKey) {
            throw new Error("No API key to update");
        }
        setApiKey((prev) => {
            if (!prev) {
                return prev;
            }
            return {
                ...prev,
                ...updatedApiKey
            };
        });
    };

    return (
        <ApiKeyContext.Provider value={{ apiKey, updateApiKey }}>
            {children}
        </ApiKeyContext.Provider>
    );
}

export default ApiKeyProvider;
