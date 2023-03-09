export const TEST_APP_URL = process.env.TEST_APP_URL;
export const TEST_APP_MEMBER_URL = process.env.TEST_APP_MEMBER_URL;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
