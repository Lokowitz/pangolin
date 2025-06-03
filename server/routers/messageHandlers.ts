import {
    handleRegisterMessage,
    handleDockerStatusMessage,
    handleDockerContainersMessage
} from "./newt";
import { MessageHandler } from "./ws";

export const messageHandlers: Record<string, MessageHandler> = {
    "newt/wg/register": handleRegisterMessage,
    "newt/socket/status": handleDockerStatusMessage,
    "newt/socket/containers": handleDockerContainersMessage
};
