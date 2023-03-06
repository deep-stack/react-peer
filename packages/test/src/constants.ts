// TODO: Accept CLI arguments

export const TOTAL_PEERS = 5;
export const ONE_SECOND = 1000; // 1s

// Time within which the peer node should be started
export const NODE_START_TIMEOUT = TOTAL_PEERS * 30 * ONE_SECOND;
export const NODE_START_CHECK_INTERVAL = 3 * ONE_SECOND; // 3s
export const NODE_PEER_CONN_TIMEOUT = 30 * ONE_SECOND; // 30s
export const NODE_PEER_CONN_CHECK_INTERVAL = 5 * ONE_SECOND; // 5s
export const FLOOD_CHECK_DELAY = 10 * ONE_SECOND; // 10s
