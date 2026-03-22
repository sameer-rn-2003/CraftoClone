module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  watchman: false,
  transformIgnorePatterns: [
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|@react-navigation' +
      '|react-redux' +
      '|@reduxjs/toolkit' +
      '|immer' +
      '|@react-native-async-storage/async-storage' +
      '|react-native-gesture-handler' +
      '|react-native-image-picker' +
      '|react-native-view-shot' +
      '|react-native-share' +
      '|react-native-fs' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      ')/)',
  ],
};
