// TODO: Accept CLI arguments

export const TOTAL_PEERS = 5;
export const MS_IN_SECOND = 1000; // ms

// Time within which the peer node should be started
export const NODE_START_TIMEOUT = TOTAL_PEERS * 30 * MS_IN_SECOND;
export const NODE_START_CHECK_INTERVAL = 3 * MS_IN_SECOND; // 3s
export const NODE_PEER_CONN_TIMEOUT = 30 * MS_IN_SECOND; // 30s
export const NODE_PEER_CONN_CHECK_INTERVAL = 5 * MS_IN_SECOND; // 5s
export const FLOOD_CHECK_DELAY = 10 * MS_IN_SECOND; // 10s
