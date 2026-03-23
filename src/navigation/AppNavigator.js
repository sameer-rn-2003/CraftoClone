// src/navigation/AppNavigator.js
// Root navigator with a single Stack flow.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import TemplateScreen from '../screens/TemplateScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import { COLORS } from '../utils/constants';
import i18n from '../i18n';
import { getStoredLanguage } from '../i18n/storage';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const [isReady, setIsReady] = useState(false);
    const [initialRoute, setInitialRoute] = useState('Login');

    useEffect(() => {
        let mounted = true;
        (async () => {
            const stored = await getStoredLanguage();
            const isSupported = stored && SUPPORTED_LANGUAGES.some(l => l.code === stored);

            if (isSupported) {
                await i18n.changeLanguage(stored);
            } else {
                // Default to English when language isn't selected or is invalid.
                await i18n.changeLanguage('en');
            }
            if (mounted) setInitialRoute('Login');
            if (mounted) setIsReady(true);
        })();
        return () => { mounted = false; };
    }, []);

    if (!isReady) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: COLORS.background },
                    gestureEnabled: true,
                }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
                <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen
                    name="TemplateScreen"
                    component={TemplateScreen}
                    options={{ gestureEnabled: true }}
                />
                <Stack.Screen
                    name="EditorScreen"
                    component={EditorScreen}
                    options={{ gestureEnabled: true }}
                />
                <Stack.Screen
                    name="PreviewScreen"
                    component={PreviewScreen}
                    options={{ gestureEnabled: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default AppNavigator;
