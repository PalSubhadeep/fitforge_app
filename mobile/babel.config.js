module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Required by react-native-reanimated v4 (used here via
    // react-native-keyboard-controller) to compile its worklets.
    // This MUST be listed last per Reanimated's own setup docs.
    plugins: ['react-native-worklets/plugin']
  };
};
