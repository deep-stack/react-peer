// TODO: Accept CLI arguments

export const TOTAL_PEERS = 3;
export const TEST_RETRIES = 15;
export const MIN_REQUIRED_CONNECTIONS = 4;

export const FLOOD_LOG_CHECK_INTERVAL = 8; // seconds
export const WAIT_BEFORE_RETRY = 10; // seconds
export const CHECK_CONNECTION_INTERVAL = 3; // seconds

// Time within which the peer node should be started
export const NODE_START_TIMEOUT = 120 * 1000; // 120s
export const NODE_START_CHECK_INTERVAL = 5 * 1000; // 5s
export const NODE_PEER_CONN_TIMEOUT = 30 * 1000; // 30s
export const NODE_PEER_CONN_CHECK_INTERVAL = 5 * 1000; // 5s
export const FLOOD_CHECK_DELAY = 10 * 1000; // 10s
