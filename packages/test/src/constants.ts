// TODO: Accept CLI arguments

export const TOTAL_PEERS = 5;

// Time within which the peer node should be started
export const NODE_START_TIMEOUT = TOTAL_PEERS * 30 * 1000;
export const NODE_START_CHECK_INTERVAL = 3 * 1000; // 3s
export const NODE_PEER_CONN_TIMEOUT = 30 * 1000; // 30s
export const NODE_PEER_CONN_CHECK_INTERVAL = 5 * 1000; // 5s
export const FLOOD_CHECK_DELAY = 5 * 1000; // 5s
