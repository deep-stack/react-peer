// TODO: accept these constants as CLI arguments
const TOTAL_PEERS = 3;
const TEST_RETRIES = 15;
const MIN_REQUIRED_CONNECTIONS = 4;

const TEST_INTERVAL = 8; // seconds
const WAIT_BEFORE_RETRY = 10; // seconds
const CHECK_CONNECTION_INTERVAL = 3; // seconds
module.exports = {
    TOTAL_PEERS,
    TEST_RETRIES,
    MIN_REQUIRED_CONNECTIONS,
    TEST_INTERVAL,
    WAIT_BEFORE_RETRY,
    CHECK_CONNECTION_INTERVAL,
};
