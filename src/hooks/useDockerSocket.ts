import { createApiClient, formatAxiosError } from "@app/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useEnvContext } from "./useEnvContext";
import {
    Container,
    GetDockerStatusResponse,
    GetSiteResponse,
    ListContainersResponse,
    TriggerFetchResponse
} from "@server/routers/site";
import { AxiosResponse } from "axios";
import { toast } from "./useToast";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useDockerSocket(siteId: number) {
    if (!siteId) {
        throw new Error("Site ID is required to use Docker Socket");
    }

    const [site, setSite] = useState<GetSiteResponse>();
    const [dockerSocket, setDockerSocket] = useState<GetDockerStatusResponse>();
    const [containers, setContainers] = useState<Container[]>([]);

    const api = createApiClient(useEnvContext());

    const { dockerSocketEnabled: isEnabled = true } = site || {};
    const { isAvailable = false, socketPath } = dockerSocket || {};

    const fetchSite = useCallback(async () => {
        try {
            const res = await api.get<AxiosResponse<GetSiteResponse>>(
                `/site/${siteId}`
            );

            if (res.status === 200) {
                setSite(res.data.data);
            }
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Failed to fetch resource",
                description: formatAxiosError(
                    err,
                    "An error occurred while fetching resource"
                )
            });
        }
    }, [api, siteId]);

    const checkDockerSocket = useCallback(async () => {
        if (!isEnabled) {
            console.warn("Docker socket is not enabled for this site.");
            return;
        }
        try {
            const res = await api.post(`/site/${siteId}/docker/check`);
            console.log("Docker socket check response:", res);
        } catch (error) {
            console.error("Failed to check Docker socket:", error);
        }
    }, [api, siteId, isEnabled]);

    const getDockerSocketStatus = useCallback(async () => {
        if (!isEnabled) {
            console.warn("Docker socket is not enabled for this site.");
            return;
        }

        try {
            const res = await api.get<AxiosResponse<GetDockerStatusResponse>>(
                `/site/${siteId}/docker/status`
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
    }, [api, siteId, isEnabled]);

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
                        >(`/site/${siteId}/docker/containers`);
                        setContainers(res.data.data);
                        return;
                    } catch (error: any) {
                        attempt++;

                        // Check if the error is a 425 (Too Early) status
                        if (error?.response?.status === 425) {
                            if (attempt < maxRetries) {
                                // Ask the newt server to check containers
                                await getContainers();
                                // Exponential backoff: 2s, 4s, 8s...
                                const retryDelay = Math.min(
                                    2000 * Math.pow(2, attempt - 1),
                                    10000
                                );
                                console.log(
                                    `Containers not ready yet (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelay}ms...`
                                );
                                await sleep(retryDelay);
                                continue;
                            } else {
                                console.warn(
                                    "Max retry attempts reached. Containers may still be loading."
                                );
                                toast({
                                    variant: "destructive",
                                    title: "Containers not ready",
                                    description:
                                        "Containers are still loading. Please try again in a moment."
                                });
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
                    `/site/${siteId}/docker/trigger`
                );
                await sleep(1000); // Wait a second before fetching containers
                // TODO: identify a way to poll the server for latest container list periodically?
                await fetchContainerList();
                return res.data.data;
            } catch (error) {
                console.error("Failed to trigger Docker containers:", error);
            }
        },
        [api, siteId, isEnabled, isAvailable]
    );

    useEffect(() => {
        fetchSite();
    }, [fetchSite]);

    // 2. Docker socket status monitoring
    useEffect(() => {
        if (!isEnabled || isAvailable) {
            return;
        }

        checkDockerSocket();
        const timeout = setTimeout(() => {
            getDockerSocketStatus();
        }, 3000);

        return () => clearTimeout(timeout);
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
