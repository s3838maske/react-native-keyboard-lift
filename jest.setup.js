// Keep mock call history from leaking between test files: the keyboard store,
// the focus registry and the warning de-duplication are all module-level
// singletons by design.
afterEach(() => {
  jest.clearAllMocks();
});
