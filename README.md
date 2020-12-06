## Query Retry

> A JavaScript library to better manage API query retries.

Sometimes our API queries fails and all we want is the app to try to query the backend again. This library will let you configure how many times we want our app to call the API again so we dont have to bother the user to ask him to press a try again button or reload the whole page.

## Installing

Install the library via `npm install query-retry` or `yarn add query-retry`. Or you can even download the [file here](https://github.com/Chuque/query-retry/blob/master/lib/query-retry.min.js) and load with the good and old way `<script src="query-retry.min.js"></script>`.

## How to use

If you used npm/yarn, just import the file:

```js
import queryRetry from 'query-retry';
```

And now you can use it like:

```js

const getCustomers = () => queryRetry(
  () => axiosInstance.get('/customers'), //an async function that returns a Promise when called
  (response) => response ? true : false, //a sync function that validates the response and returns a boolean indicating if it is valid or not
  {
    maxRetry: 2, //how many times the query should be retried if it fails
    timeout: 4000, //how long queryRetry will wait a response before giving up and trying again
    keepFirstQueryAlive: true //if queryRetry should keep waiting for the first query response while it awaits the next queries responses
  }
);

const fetchCustomerInfo = () => {
  return getCustomers()
    .then(response => {
      //do something with the query response data
    })
    .catch((error) => {
      //do something with the query response error
    })
}
```

## Testing

You can see the tests on [index.test.js](https://github.com/Chuque/query-retry/blob/master/src/index.test.js), use `npm run test` to run the tests.
