# 4A-Battery

## Call test page tests

From the `code/4A-Battery` directory, install dependencies and run the call test page tests without building the app:

```sh
npm install
npm test
```

If running commands from the parent `cooee` directory, install dependencies in the app and run the root test script:

```sh
npm --prefix ./code/4A-Battery install
npm test
```

Use `npm run test:watch` from either directory to keep the tests running while editing. The tests use Vitest, jsdom, and React Testing Library; they exercise the mock call flow and do not run `npm build`.