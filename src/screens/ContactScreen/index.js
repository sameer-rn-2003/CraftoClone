import React from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SPACING } from '../../utils/constants';

const ContactScreen = ({ navigation }) => (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                <MaterialCommunityIcons name="arrow-left" style={styles.backIcon} />
            </Pressable>
            <Text style={styles.title}>Contact us</Text>
            <View style={styles.backBtn} />
        </View>
        <View style={styles.body}>
            <MaterialCommunityIcons name="headset" style={styles.icon} />
            <Text style={styles.heading}>Contact us</Text>
            <Text style={styles.subtext}>This screen will be available soon.</Text>
        </View>
    </SafeAreaView>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.base, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 24, color: COLORS.text },
    title: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.text },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    icon: { fontSize: 48, color: COLORS.primary, marginBottom: SPACING.base },
    heading: { fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, color: COLORS.text, marginBottom: SPACING.sm },
    subtext: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center' },
});

export default ContactScreen;
