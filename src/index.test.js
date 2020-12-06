import queryRetry from './index'

const mockApiQuery = (delayResponse, shouldFailQuery, calledTimes) => {
  return () => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFailQuery) {
        reject(new Error('Query failed'))
      } else {
        resolve(mockSuccessfulResponse(calledTimes))
      }
    }, delayResponse);
  })
};

const mockSuccessfulResponse = (calledTimes) => ({
  id: 1,
  name: 'Rafael Chuque',
  calledTimes,
});

describe('queryRetry', () => {
  it('should return successful response on first query', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(200, false, 1));

    return queryRetry(query, () => true)
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(1))
      })
  })

  it('should return successful response on second query', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(200, true, 1))
      .mockImplementationOnce(mockApiQuery(200, false, 2));

    return queryRetry(query, () => true, { maxRetry: 1 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(2))
      })
  })

  it('should return successful response on second query', () => {
    // jest.setTimeout(5000);

    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(200, true, 1))
      .mockImplementationOnce(mockApiQuery(200, false, 2))
      .mockImplementationOnce(mockApiQuery(200, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(2))
      })
  })

  it('should return successful response on third query', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(200, true, 1))
      .mockImplementationOnce(mockApiQuery(200, true, 2))
      .mockImplementationOnce(mockApiQuery(200, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(3))
      })
  })

  it('should return successful response on first query when it takes longer than timeout when first query arrives first with keepAlive true with 2 calls', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(250, false, 1))
      .mockImplementationOnce(mockApiQuery(200, false, 2))
      .mockImplementationOnce(mockApiQuery(200, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2, timeout: 150, keepFirstQueryAlive: true })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(1))
      })
  })

  it('should return successful response on first query when it takes longer than timeout when first query arrives first with keepAlive true with 3 calls', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(800, false, 1))
      .mockImplementationOnce(mockApiQuery(350, false, 2))
      .mockImplementationOnce(mockApiQuery(350, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2, timeout: 300, keepFirstQueryAlive: true })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(1))
      })
  })

  it('should return successful response on second query when it arrives faster than first query with keepAlive true', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(600, false, 1))
      .mockImplementationOnce(mockApiQuery(200, false, 2))
      .mockImplementationOnce(mockApiQuery(200, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2, timeout: 250, keepFirstQueryAlive: true })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(2))
      })
  })

  it('should return successful response on third query when it arrives faster than first query with keepAlive true', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(800, false, 1))
      .mockImplementationOnce(mockApiQuery(300, false, 2))
      .mockImplementationOnce(mockApiQuery(200, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2, timeout: 250, keepFirstQueryAlive: true })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(3))
      })
  })

  it('should throw error when maxRetry is 0 and timeout is reached', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(300, false, 1))
      .mockImplementationOnce(mockApiQuery(300, false, 2))
      .mockImplementationOnce(mockApiQuery(300, false, 3));

    return queryRetry(query, () => true, { maxRetry: 0, timeout: 200 })
      .catch(e => {
        expect(e.message).toBe('queryRetry - timeout reached');
      })
  })

  it('should retry query if maxRetry is higher than 0 and responseValidator returns false', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, false, 1))
      .mockImplementationOnce(mockApiQuery(100, false, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    return queryRetry(query, () => false, { maxRetry: 2, timeout: 200 })
      .catch(e => {
        expect(e.message).toBe('queryRetry - responseValidator found no valid responses');
      })
  })

  it('should throw error if all responses are invalid', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, false, 1))
      .mockImplementationOnce(mockApiQuery(100, false, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    return queryRetry(query, () => false, { maxRetry: 2, timeout: 200 })
      .catch(e => {
        expect(e.message).toBe('queryRetry - responseValidator found no valid responses');
      })
  })

  it('should return the first valid response - query success - 1', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, false, 1))
      .mockImplementationOnce(mockApiQuery(100, false, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    const responseValidator = jest.fn()
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => false)

    return queryRetry(query, responseValidator, { maxRetry: 2, timeout: 200 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(1))
      })
  })

  it('should return the first valid response - query success - 2', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, false, 1))
      .mockImplementationOnce(mockApiQuery(100, false, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    const responseValidator = jest.fn()
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => false)

    return queryRetry(query, responseValidator, { maxRetry: 2, timeout: 200 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(2))
      })
  })

  it('should return the first valid response - query success - 3', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, false, 1))
      .mockImplementationOnce(mockApiQuery(100, false, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    const responseValidator = jest.fn()
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => false)
      .mockImplementationOnce(() => true)

    return queryRetry(query, responseValidator, { maxRetry: 2, timeout: 200 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(3))
      })
  })

  it('should return the first valid response - query fail - 2', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, true, 1))
      .mockImplementationOnce(mockApiQuery(100, false, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2, timeout: 200 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(2))
      })
  })

  it('should return the first valid response - query fail - 3', () => {
    const query = jest.fn()
      .mockImplementationOnce(mockApiQuery(100, true, 1))
      .mockImplementationOnce(mockApiQuery(100, true, 2))
      .mockImplementationOnce(mockApiQuery(100, false, 3));

    return queryRetry(query, () => true, { maxRetry: 2, timeout: 200 })
      .then(response => {
        expect(response).toStrictEqual(mockSuccessfulResponse(3))
      })
  })
})
