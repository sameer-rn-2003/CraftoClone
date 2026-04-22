// App.js
// Root application component — wraps app with all required providers

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import store from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import './src/i18n';
import { subscribeToFcmTokenRefresh, syncFcmToken } from './src/services/fcmService';

const FcmTokenManager = () => {
    const isLoggedIn = useSelector(state => state.poster.isLoggedIn);

    useEffect(() => {
        if (!isLoggedIn) {
            return undefined;
        }

        syncFcmToken().catch(error => {
            console.log('FCM token sync error', error);
        });

        const unsubscribe = subscribeToFcmTokenRefresh(() => {});

        return () => {
            unsubscribe?.();
        };
    }, [isLoggedIn]);

    return null;
};

const App = () => {
    return (
        <GestureHandlerRootView style={styles.root}>
            <Provider store={store}>
                <SafeAreaProvider>
                    <FcmTokenManager />
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
