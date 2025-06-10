import { createApiClient, formatAxiosError } from "@app/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useEnvContext } from "./useEnvContext";
import {
    Container,
    GetDockerStatusResponse,
    ListContainersResponse,
    TriggerFetchResponse
} from "@server/routers/site";
import { AxiosResponse } from "axios";
import { toast } from "./useToast";
import { Site } from "@server/db";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useDockerSocket(site: Site) {
    console.log(`useDockerSocket initialized for site ID: ${site.siteId}`);

    const [dockerSocket, setDockerSocket] = useState<GetDockerStatusResponse>();
    const [containers, setContainers] = useState<Container[]>([]);

    const api = createApiClient(useEnvContext());

    const { dockerSocketEnabled: rawIsEnabled = true, type: siteType } = site || {};
    const isEnabled = rawIsEnabled && siteType === "newt";
    const { isAvailable = false, socketPath } = dockerSocket || {};

    const checkDockerSocket = useCallback(async () => {
        if (!isEnabled) {
            console.warn("Docker socket is not enabled for this site.");
            return;
        }
        try {
            const res = await api.post(`/site/${site.siteId}/docker/check`);
            console.log("Docker socket check response:", res);
        } catch (error) {
            console.error("Failed to check Docker socket:", error);
        }
    }, [api, site.siteId, isEnabled]);

    const getDockerSocketStatus = useCallback(async () => {
        if (!isEnabled) {
            console.warn("Docker socket is not enabled for this site.");
            return;
        }

        try {
            const res = await api.get<AxiosResponse<GetDockerStatusResponse>>(
                `/site/${site.siteId}/docker/status`
            );

            if (res.status === 200) {
                setDockerSocket(res.data.data);
            } else {
                console.error("Failed to get Docker status:", res);
                toast({
                    variant: "destructive",
                    title: "Failed to get Docker status",
                    description:
                        "An error occurred while fetching Docker status."
                });
            }
        } catch (error) {
            console.error("Failed to get Docker status:", error);
            toast({
                variant: "destructive",
                title: "Failed to get Docker status",
                description: "An error occurred while fetching Docker status."
            });
        }
    }, [api, site.siteId, isEnabled]);

    const getContainers = useCallback(
        async (maxRetries: number = 3) => {
            if (!isEnabled || !isAvailable) {
                console.warn("Docker socket is not enabled or available.");
                return;
            }

            const fetchContainerList = async () => {
                if (!isEnabled || !isAvailable) {
                    return;
                }

                let attempt = 0;
                while (attempt < maxRetries) {
                    try {
                        const res = await api.get<
                            AxiosResponse<ListContainersResponse>
                        >(`/site/${site.siteId}/docker/containers`);
                        setContainers(res.data.data);
                        return res.data.data;
                    } catch (error: any) {
                        attempt++;

                        // Check if the error is a 425 (Too Early) status
                        if (error?.response?.status === 425) {
                            if (attempt < maxRetries) {
                                console.log(
                                    `Containers not ready yet (attempt ${attempt}/${maxRetries}). Retrying in 250ms...`
                                );
                                await sleep(250);
                                continue;
                            } else {
                                console.warn(
                                    "Max retry attempts reached. Containers may still be loading."
                                );
                                // toast({
                                //     variant: "destructive",
                                //     title: "Containers not ready",
                                //     description:
                                //         "Containers are still loading. Please try again in a moment."
                                // });
                            }
                        } else {
                            console.error(
                                "Failed to fetch Docker containers:",
                                error
                            );
                            toast({
                                variant: "destructive",
                                title: "Failed to fetch containers",
                                description: formatAxiosError(
                                    error,
                                    "An error occurred while fetching containers"
                                )
                            });
                        }
                        break;
                    }
                }
            };

            try {
                const res = await api.post<AxiosResponse<TriggerFetchResponse>>(
                    `/site/${site.siteId}/docker/trigger`
                );
                // TODO: identify a way to poll the server for latest container list periodically?
                await fetchContainerList();
                return res.data.data;
            } catch (error) {
                console.error("Failed to trigger Docker containers:", error);
            }
        },
        [api, site.siteId, isEnabled, isAvailable]
    );

    // 2. Docker socket status monitoring
    useEffect(() => {
        if (!isEnabled || isAvailable) {
            return;
        }

        checkDockerSocket();
        getDockerSocketStatus();

    }, [isEnabled, isAvailable, checkDockerSocket, getDockerSocketStatus]);

    return {
        isEnabled,
        isAvailable: isEnabled && isAvailable,
        socketPath,
        containers,
        check: checkDockerSocket,
        status: getDockerSocketStatus,
        fetchContainers: getContainers
    };
}
