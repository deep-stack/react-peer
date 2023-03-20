// Number of browser peers to spin up
export const TOTAL_PEERS = 5;

// Time within which peer nodes should be started
export const NODE_START_TIMEOUT = TOTAL_PEERS * 30 * 1000;
export const NODE_START_CHECK_INTERVAL = 5 * 1000; // 5s

// Time within which peer nodes should be connected
export const NODE_PEER_CONN_TIMEOUT = 30 * 1000; // 30s
export const NODE_PEER_CONN_CHECK_INTERVAL = 5 * 1000; // 5s

// Time to wait for before checking for flood messages
export const FLOOD_CHECK_DELAY = 10 * 1000; // 10s
export const MESSAGE_ARRIVAL_TIMEOUT = 10 * 1000; // 10ss

// Time to wait for flood messages to be received
export const MESSAGE_CHECK_TIMEOUT = 30 * 1000; // 30s
