// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');

// Firebase 10+ uses package.json "exports" conditions.
// Without this, Metro picks the "default" (browser) bundle of @firebase/auth,
// which never calls registerAuth("ReactNative") → "Component auth has not been registered yet".
config.resolver.unstable_conditionNames = ['react-native', 'require', 'default'];

module.exports = config;
