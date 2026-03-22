import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = String(value);
    }),
    getItem: jest.fn(async (key) => (key in store ? store[key] : null)),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      store = {};
    }),
  };
});

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(async () => ''),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(async () => ({})),
}));

jest.mock('react-native-fs', () => ({
  PicturesDirectoryPath: '/tmp/pictures',
  DocumentDirectoryPath: '/tmp/documents',
  CachesDirectoryPath: '/tmp/caches',
  exists: jest.fn(async () => true),
  mkdir: jest.fn(async () => {}),
  writeFile: jest.fn(async () => {}),
  scanFile: jest.fn(async () => {}),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));
