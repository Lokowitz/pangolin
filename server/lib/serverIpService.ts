import axios from "axios";

let serverIp: string | null = null;

const services = [
    "https://ifconfig.io/ip",
    "https://api.ipify.org",
    "https://checkip.amazonaws.com"
];

export async function fetchServerIp() {
    for (const url of services) {
        try {
            const response = await axios.get(url, { timeout: 5000 });
            serverIp = response.data.trim();
            console.log("Detected public IP:", serverIp);
            return; 
        } catch (err: any) {
            console.warn(`Failed to fetch server IP from ${url}: ${err.message || err.code}`);
        }
    }

    console.error("All attempts to fetch server IP failed.");
}

export function getServerIp() {
    return serverIp;
}
