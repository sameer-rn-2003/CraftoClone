// App.js
// Root application component — wraps app with all required providers

import React from 'react';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';

const App = () => {
    return (
        <GestureHandlerRootView style={styles.root}>
            <Provider store={store}>
                <SafeAreaProvider>
                    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                        <AppNavigator />
                    </SafeAreaView>
                </SafeAreaProvider>
            </Provider>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    safeArea: { flex: 1 },
});

export default App;
