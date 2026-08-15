module.exports = function (api) {
  api.cache(true);
  return {
    // Handles the library's TypeScript source too, which Metro loads directly
    // via the package's `react-native` field.
    presets: ['babel-preset-expo'],
  };
};
