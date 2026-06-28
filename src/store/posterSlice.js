// src/store/posterSlice.js
// Redux slice — all poster editor state incl. full customization

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // ── Core ────────────────────────────────────────────────
    selectedTemplate: null,
    userPhoto: null,
    userName: '',
    isLoggedIn: false,
    userMessage: '',
    isPremium: false,
    designLayoutIndex: 0,
    specialCategoryContext: null,
    selectedTags: [],
    premiumProfile: {
        activeSection: 'personal',
        personal: {
            mobileNumber: '',
            address: '',
            socialHandle: '',
            socialHandles: {
                facebook: '',
                instagram: '',
                twitter: '',
                snapchat: '',
                other: '',
            },
            organizationName: '',
            organizationLogo: '',
        },
        business: {
            businessName: '',
            businessDescription: '',
            businessLogo: '',
            contactMobileNumber: '',
            contactAddress: '',
            contactSocialHandle: '',
            socialHandles: {
                facebook: '',
                instagram: '',
                twitter: '',
                snapchat: '',
                other: '',
            },
        },
    },

    // ── Photo drag & resize ────────────────────────────────
    photoPosition: { x: 0, y: 0 },
    photoScale: 1.0,      // 0.5 → 2.0
    userPhotoAnimation: 'none',
    backgroundVideoDuration: null,

    // ── Text customization ──────────────────────────────────
    nameColor: null,         // null = use template default
    messageColor: null,      // null = use template default
    nameFontSize: null,      // null = use template default (number override)
    messageFontSize: null,
    namePosition: null,
    nameScale: 1.0,
    messagePosition: null,
    messageScale: 1.0,
    nameBold: true,
    nameItalic: false,
    messageBold: false,
    messageItalic: false,
    textAlign: 'center',     // 'left' | 'center' | 'right'
    textShadow: false,
    showName: true,           // false = hide name text layer
    showMessage: false,       // false = hide message text layer

    // ── Photo frame shape ────────────────────────────────────
    photoShape: 'circle',  // 'template' | 'circle' | 'square' | 'rectangle' | 'rect' | 'triangle' | 'star' | 'hexagon'

    // ── Color accent override ────────────────────────────────
    accentColorOverride: null, // null = use template accent

    // ── Stickers ────────────────────────────────────────────
    // Each sticker: { id, emoji, x, y }
    stickers: [],

    // ── Background overlay ───────────────────────────────────
    bgOverlayColor: null,    // e.g. 'rgba(0,0,0,0.3)' — null = off
    bgOverlayOpacity: 0.3,

    // ── Saved posters ────────────────────────────────────────
    savedPosters: [],

    // ── Dynamic text fields (for template-driven fields beyond name/message) ──
    dynamicTextFields: {},  // { [key]: { value: '', fontSize: null, color: null, bold: false, italic: false, position: { x: 0, y: 0 }, scale: 1 } }

    // ── Home ─────────────────────────────────────────────────
    activeCategory: 'political',
    // Notifications
    unreadNotificationCount: 0,
    textFieldPositions: {}, // { fieldId: { x: number, y: number } }
    activeTextField: null, // Currently selected text field ID
};

const posterSlice = createSlice({
    name: 'poster',
    initialState,
    reducers: {
        // Core
        setIsLoggedIn(state, { payload }) {
    state.isLoggedIn = payload;
},
        setSelectedTemplate(state, { payload }) {
            state.selectedTemplate = payload;
            state.designLayoutIndex = 0;
            state.photoPosition = { x: 0, y: 0 };
            state.photoScale = 1.0;
            state.namePosition = null;
            state.nameScale = 1.0;
            state.messagePosition = null;
            state.messageScale = 1.0;
            state.nameFontSize = null;
            state.messageFontSize = null;
            state.backgroundVideoDuration = null;
            state.dynamicTextFields = {};
        },
        setUserPhoto(state, { payload }) {
            state.userPhoto = payload;
        },
        setUserPhotoAnimation(state, { payload }) { state.userPhotoAnimation = payload || 'none'; },
        setBackgroundVideoDuration(state, { payload }) { state.backgroundVideoDuration = payload || null; },
        setUserName(state, { payload }) { state.userName = payload; },
        setUserMessage(state, { payload }) { state.userMessage = payload; },
        setPremiumStatus(state, { payload }) { state.isPremium = payload; },
        hydratePremiumProfile(state, { payload }) {
            state.premiumProfile = {
                ...state.premiumProfile,
                ...(payload || {}),
                personal: {
                    ...state.premiumProfile.personal,
                    ...(payload?.personal || {}),
                    socialHandles: {
                        ...state.premiumProfile.personal.socialHandles,
                        ...(payload?.personal?.socialHandles || {}),
                    },
                },
                business: {
                    ...state.premiumProfile.business,
                    ...(payload?.business || {}),
                    socialHandles: {
                        ...state.premiumProfile.business.socialHandles,
                        ...(payload?.business?.socialHandles || {}),
                    },
                },
            };
        },
        setPremiumProfileField(state, { payload }) {
            const { section, field, value } = payload || {};
            if (!section || !field) return;
            if (!state.premiumProfile[section]) return;
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                if (!state.premiumProfile[section][parent]) {
                    state.premiumProfile[section][parent] = {};
                }
                state.premiumProfile[section][parent][child] = value;
                return;
            }
            state.premiumProfile[section][field] = value;
        },
        setPremiumProfileActiveSection(state, { payload }) {
            state.premiumProfile.activeSection = payload === 'business' ? 'business' : 'personal';
        },
        setSpecialCategoryContext(state, { payload }) {
            state.specialCategoryContext = payload || null;
            state.selectedTags = [];
        },
        setSelectedTags(state, { payload }) {
            state.selectedTags = Array.isArray(payload) ? payload : [];
        },
        toggleSelectedTag(state, { payload }) {
            const tag = String(payload || '').trim();
            if (!tag) return;
            if (state.selectedTags.includes(tag)) {
                state.selectedTags = state.selectedTags.filter(item => item !== tag);
                return;
            }
            state.selectedTags.push(tag);
        },
        cycleDesignLayout(state) {
            const nextIndex = ((state.designLayoutIndex || 0) + 1) % 4;
            state.designLayoutIndex = nextIndex;
            state.photoPosition = { x: 0, y: 0 };
            state.namePosition = null;
            state.messagePosition = null;
            if (nextIndex === 0) {
                state.nameFontSize = null;
                state.messageFontSize = null;
            }
        },
        setDesignLayoutIndex(state, { payload }) {
            const nextIndex = Number(payload);
            state.designLayoutIndex = Number.isFinite(nextIndex)
                ? Math.max(0, Math.min(3, Math.round(nextIndex)))
                : 0;
            state.photoPosition = { x: 0, y: 0 };
            state.namePosition = null;
            state.messagePosition = null;
            if (state.designLayoutIndex === 0) {
                state.nameFontSize = null;
                state.messageFontSize = null;
            }
        },
        setPhotoPosition(state, { payload }) { state.photoPosition = payload; },
        setPhotoScale(state, { payload }) { state.photoScale = payload; },

        // Text colour
        setNameColor(state, { payload }) { state.nameColor = payload; },
        setMessageColor(state, { payload }) { state.messageColor = payload; },

        // Font size
        setNameFontSize(state, { payload }) { state.nameFontSize = payload; },
        setMessageFontSize(state, { payload }) { state.messageFontSize = payload; },
        setNamePosition(state, { payload }) { state.namePosition = payload; },
        setNameScale(state, { payload }) { state.nameScale = payload; },
        setMessagePosition(state, { payload }) { state.messagePosition = payload; },
        setMessageScale(state, { payload }) { state.messageScale = payload; },

        // Font style
        setNameBold(state, { payload }) { state.nameBold = payload; },
        setNameItalic(state, { payload }) { state.nameItalic = payload; },
        setMessageBold(state, { payload }) { state.messageBold = payload; },
        setMessageItalic(state, { payload }) { state.messageItalic = payload; },

        // Alignment & shadow
        setTextAlign(state, { payload }) { state.textAlign = payload; },
        setTextShadow(state, { payload }) { state.textShadow = payload; },
        setShowName(state, { payload }) { state.showName = payload; },
        setShowMessage(state, { payload }) { state.showMessage = payload; },

        // Photo shape
        setPhotoShape(state, { payload }) { state.photoShape = payload; },

        // Accent
        setAccentColorOverride(state, { payload }) { state.accentColorOverride = payload; },

        // Background overlay
        setBgOverlayColor(state, { payload }) { state.bgOverlayColor = payload; },
        setBgOverlayOpacity(state, { payload }) { state.bgOverlayOpacity = payload; },

        // Stickers
        addSticker(state, { payload }) {
            // payload: { emoji }  — we assign it a centre-ish position
            state.stickers.push({
                id: `sticker_${Date.now()}`,
                emoji: payload.emoji,
                x: 150,
                y: 250,
            });
        },
        updateStickerPosition(state, { payload }) {
            // payload: { id, x, y }
            const sticker = state.stickers.find(item => item.id === payload.id);
            if (sticker) { sticker.x = payload.x; sticker.y = payload.y; }
        },
        removeSticker(state, { payload }) {
            // payload: id string
            state.stickers = state.stickers.filter(s => s.id !== payload);
        },

        // Persist saved poster
        addSavedPoster(state, { payload }) {
            state.savedPosters.unshift({
                ...payload,
                id: `${Date.now()}`,
                timestamp: new Date().toISOString(),
            });
        },

        // Reset editor fields (but keep template)
        resetEditor(state) {
            state.userPhoto = null;
            state.userName = '';
            state.userMessage = '';
            state.photoPosition = { x: 0, y: 0 };
            state.photoScale = 1.0;
            state.userPhotoAnimation = 'none';
            state.backgroundVideoDuration = null;            state.nameColor = null;
            state.messageColor = null;
            state.nameFontSize = null;
            state.messageFontSize = null;
            state.namePosition = null;
            state.nameScale = 1.0;
            state.messagePosition = null;
            state.messageScale = 1.0;
            state.nameBold = true;
            state.nameItalic = false;
            state.messageBold = false;
            state.messageItalic = false;
            state.textAlign = 'center';
            state.textShadow = false;
            state.showName = true;
            state.showMessage = false;
            state.photoShape = 'template';
            state.accentColorOverride = null;
            state.bgOverlayColor = null;
            state.bgOverlayOpacity = 0.3;
            state.stickers = [];
            state.designLayoutIndex = 0;
            state.specialCategoryContext = null;
            state.selectedTags = [];
            state.premiumProfile = {
                activeSection: 'personal',
                personal: {
                    mobileNumber: '',
                    address: '',
                    socialHandle: '',
                    socialHandles: {
                        facebook: '',
                        instagram: '',
                        twitter: '',
                        snapchat: '',
                        other: '',
                    },
                    organizationName: '',
                    organizationLogo: '',
                },
                business: {
                    businessName: '',
                    businessDescription: '',
                    businessLogo: '',
                    contactMobileNumber: '',
                    contactAddress: '',
                    contactSocialHandle: '',
                    socialHandles: {
                        facebook: '',
                        instagram: '',
                        twitter: '',
                        snapchat: '',
                        other: '',
                    },
                },
            };
        },

        setDynamicTextField(state, { payload }) {
            const { key, field } = payload || {};
            if (!key) return;
            state.dynamicTextFields[key] = {
                ...state.dynamicTextFields[key],
                ...(field || {}),
            };
        },
        setDynamicTextFields(state, { payload }) {
            state.dynamicTextFields = { ...state.dynamicTextFields, ...(payload || {}) };
        },
        resetDynamicTextFields(state) {
            state.dynamicTextFields = {};
        },
        setUnreadNotificationCount(state, { payload }) { state.unreadNotificationCount = Number(payload) || 0; },
        setActiveCategory(state, { payload }) { state.activeCategory = payload; },
        setTextFieldPosition: (state, action) => {
            const { id, x, y } = action.payload;
            state.textFieldPositions[id] = { x, y };
        },
        setActiveTextField: (state, action) => {
            state.activeTextField = action.payload;
        },
        resetTextFields: (state) => {
            state.textFieldPositions = {};
            state.activeTextField = null;
        },
        resetTextFieldPosition: (state, action) => {
            const { id } = action.payload;
            delete state.textFieldPositions[id];
        },
    },
});

export const {
    setSelectedTemplate, setUserPhoto, setUserName, setUserMessage,
    setUserPhotoAnimation, setBackgroundVideoDuration,
    setPremiumStatus, hydratePremiumProfile, setPremiumProfileField, setPremiumProfileActiveSection,
    setSpecialCategoryContext, setSelectedTags, toggleSelectedTag, cycleDesignLayout, setDesignLayoutIndex,
    setPhotoPosition, setPhotoScale,
    setNameColor, setMessageColor,
    setNameFontSize, setMessageFontSize,
    setNamePosition, setNameScale, setMessagePosition, setMessageScale,
    setNameBold, setNameItalic, setMessageBold, setMessageItalic,
    setTextAlign, setTextShadow, setShowName, setShowMessage,
    setPhotoShape, setAccentColorOverride,
    setBgOverlayColor, setBgOverlayOpacity,
    addSticker, updateStickerPosition, removeSticker,
    addSavedPoster, resetEditor, setActiveCategory,setIsLoggedIn,
    setUnreadNotificationCount,
    setDynamicTextField, setDynamicTextFields, resetDynamicTextFields,
    setTextFieldPosition, setActiveTextField, resetTextFields, resetTextFieldPosition
} = posterSlice.actions;

export default posterSlice.reducer;
