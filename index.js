/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App'; // now points to App.js (not App.tsx)
import { name as appName } from './app.json';
import { registerBackgroundHandler } from './src/services/notificationHandler';

registerBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
