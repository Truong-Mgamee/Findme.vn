// react-native jest preset mocks native modules; nothing extra needed for react-native-svg (host components).
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });
