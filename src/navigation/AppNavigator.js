// src/navigation/AppNavigator.js
// Root navigator: Bottom Tabs (Home, My Posters) with a Stack navigator
// layered on top for the editor flow.

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import TemplateScreen from '../screens/TemplateScreen';
import EditorScreen from '../screens/EditorScreen';
import PreviewScreen from '../screens/PreviewScreen';
import { COLORS, FONTS } from '../utils/constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab icon component ────────────────────────────────────────────
const TabIcon = ({ emoji, label, focused }) => (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
        <Text style={styles.tabEmoji}>{emoji}</Text>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {label}
        </Text>
    </View>
);

// ─── Bottom tab navigator ──────────────────────────────────────────
const HomeTabs = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
        }}>
        <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
                tabBarIcon: ({ focused }) => (
                    <TabIcon emoji="🏠" label="Home" focused={focused} />
                ),
            }}
        />
        <Tab.Screen
            name="MyPosters"
            component={MyPostersPlaceholder}
            options={{
                tabBarIcon: ({ focused }) => (
                    <TabIcon emoji="🖼️" label="My Posters" focused={focused} />
                ),
            }}
        />
    </Tab.Navigator>
);

// ─── My Posters placeholder ────────────────────────────────────────
const MyPostersPlaceholder = () => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>🖼️</Text>
        <Text style={styles.placeholderTitle}>My Posters</Text>
        <Text style={styles.placeholderSub}>
            Saved posters will appear here
        </Text>
    </View>
);

const AppNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: COLORS.background },
                gestureEnabled: true,
            }}>
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
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

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        height: 62,
        paddingBottom: 6,
        paddingTop: 6,
    },
    tabIcon: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    tabIconActive: {
        backgroundColor: COLORS.primary + '25',
    },
    tabEmoji: { fontSize: 20 },
    tabLabel: {
        fontSize: 9,
        color: COLORS.textMuted,
        marginTop: 1,
        fontWeight: FONTS.weights.medium,
    },
    tabLabelActive: {
        color: COLORS.primary,
    },

    // Placeholder screen
    placeholder: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderEmoji: { fontSize: 64 },
    placeholderTitle: {
        fontSize: FONTS.sizes.xl,
        fontWeight: FONTS.weights.bold,
        color: COLORS.text,
    },
    placeholderSub: {
        fontSize: FONTS.sizes.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default AppNavigator;
