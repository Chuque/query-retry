const ERROR_MESSAGE_PREFIX = 'queryRetry';
const TIMEOUT_REACHED_ERROR_MESSAGE = `${ERROR_MESSAGE_PREFIX} - timeout reached`;
const RESPONSE_VALIDATOR_INVALID_RESPONSE_ERROR_MESSAGE = `${ERROR_MESSAGE_PREFIX} - responseValidator found no valid responses`;

const DEFAULT_CONFIG = {
  maxRetry: 0, // Maximum amount of retries if the query fails or response is not valid by responseValidator. If 0, no retries will be made.
  timeout: 0, // Max timeout per query. If 0, no timeout will be set.
  keepFirstQueryAlive: false, // If maxRetry and timeout is higher than 0, subsequent retries will be made but the first query will be kept awaiting for response even if it reaches its timeout and the subsequent retries starts. So you may have 2 or more queries going on at same time. The first valid response that arrives will be returned.
}

const queryTimeout = async (timeout) => {
  if (timeout && timeout > 0) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error(TIMEOUT_REACHED_ERROR_MESSAGE))
      }, timeout)
    })
  } else {
    return new Promise(() => {});
  }
}

/**
 * Handles a query promise for better retry management
 * @param query An async function that returns a promise.
 * @param responseValidator A sync function that will receive the response of the query and return a boolean to check if the response is valid or not.
 * @param config Optional. Configure how queryRetry will handle your queries.
 * @returns {Promise<*>} The promise that will return the query data on success, or error on fail.
 */
const queryRetry = async (query, responseValidator, config = DEFAULT_CONFIG) => {
  let { maxRetry, timeout, keepFirstQueryAlive } = Object.assign({ ...DEFAULT_CONFIG }, config);
  if (maxRetry < 0) maxRetry = 0;
  if (!timeout || timeout < 0) timeout = 0;

  let hasPromiseReturned = false;
  let queryCount = 0;

  async function executeQuery(promises, resolve, reject) {
    try {
      queryCount++;
      const response = await Promise.race(promises);
      if (responseValidator(response)) {
        hasPromiseReturned = true;
        resolve(response);
      } else {
        const error = new Error(RESPONSE_VALIDATOR_INVALID_RESPONSE_ERROR_MESSAGE);
        error.response = response;
        throw error;
      }
    } catch (error) {
      if (!(queryCount <= maxRetry)) {
        hasPromiseReturned = true;
        reject(error)
      }
    }
  }

  async function executeQueryWithTimeout(resolve, reject) {
    do {
      const promises = [query(), queryTimeout(timeout)];
      await executeQuery(promises, resolve, reject);
    } while (!hasPromiseReturned && queryCount <= maxRetry)
  }

  return new Promise(async (resolve, reject) => {
    if (maxRetry > 0 && (timeout && timeout > 0) && keepFirstQueryAlive) {
      setTimeout(async () => {
        if (!hasPromiseReturned) {
          await executeQueryWithTimeout(resolve, reject);
        }
      }, timeout)

      const promises = [query(), queryTimeout(0)];
      await executeQuery(promises, resolve, reject);
    } else {
      await executeQueryWithTimeout(resolve, reject);
    }
  })
}

export default queryRetry;
