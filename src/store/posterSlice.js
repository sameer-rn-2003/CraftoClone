// src/store/posterSlice.js
// Redux slice — all poster editor state incl. full customization

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // ── Core ────────────────────────────────────────────────
    selectedTemplate: null,
    userPhoto: null,
    userName: '',
    userMessage: '',

    // ── Photo drag & resize ────────────────────────────────
    photoPosition: { x: 0, y: 0 },
    photoScale: 1.0,      // 0.5 → 2.0

    // ── Text customization ──────────────────────────────────
    nameColor: null,         // null = use template default
    messageColor: null,      // null = use template default
    nameFontSize: null,      // null = use template default (number override)
    messageFontSize: null,
    namePosition: { x: 0, y: 0 },
    nameScale: 1.0,
    messagePosition: { x: 0, y: 0 },
    messageScale: 1.0,
    nameBold: true,
    nameItalic: false,
    messageBold: false,
    messageItalic: false,
    textAlign: 'center',     // 'left' | 'center' | 'right'
    textShadow: false,
    showName: true,           // false = hide name text layer
    showMessage: true,        // false = hide message text layer

    // ── Photo frame shape ────────────────────────────────────
    photoShape: 'template',  // 'template' | 'circle' | 'square' | 'rounded'

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

    // ── Home ─────────────────────────────────────────────────
    activeCategory: 'political',
};

const posterSlice = createSlice({
    name: 'poster',
    initialState,
    reducers: {
        // Core
        setSelectedTemplate(state, { payload }) {
            state.selectedTemplate = payload;
            state.photoPosition = { x: 0, y: 0 };
            state.photoScale = 1.0;
            state.namePosition = { x: 0, y: 0 };
            state.nameScale = 1.0;
            state.messagePosition = { x: 0, y: 0 };
            state.messageScale = 1.0;
        },
        setUserPhoto(state, { payload }) {
            state.userPhoto = payload;
            state.photoPosition = { x: 0, y: 0 };
            state.photoScale = 1.0;
        },
        setUserName(state, { payload }) { state.userName = payload; },
        setUserMessage(state, { payload }) { state.userMessage = payload; },
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
            state.nameColor = null;
            state.messageColor = null;
            state.nameFontSize = null;
            state.messageFontSize = null;
            state.namePosition = { x: 0, y: 0 };
            state.nameScale = 1.0;
            state.messagePosition = { x: 0, y: 0 };
            state.messageScale = 1.0;
            state.nameBold = true;
            state.nameItalic = false;
            state.messageBold = false;
            state.messageItalic = false;
            state.textAlign = 'center';
            state.textShadow = false;
            state.showName = true;
            state.showMessage = true;
            state.photoShape = 'template';
            state.accentColorOverride = null;
            state.bgOverlayColor = null;
            state.bgOverlayOpacity = 0.3;
            state.stickers = [];
        },

        setActiveCategory(state, { payload }) { state.activeCategory = payload; },
    },
});

export const {
    setSelectedTemplate, setUserPhoto, setUserName, setUserMessage,
    setPhotoPosition, setPhotoScale,
    setNameColor, setMessageColor,
    setNameFontSize, setMessageFontSize,
    setNamePosition, setNameScale, setMessagePosition, setMessageScale,
    setNameBold, setNameItalic, setMessageBold, setMessageItalic,
    setTextAlign, setTextShadow, setShowName, setShowMessage,
    setPhotoShape, setAccentColorOverride,
    setBgOverlayColor, setBgOverlayOpacity,
    addSticker, updateStickerPosition, removeSticker,
    addSavedPoster, resetEditor, setActiveCategory,
} = posterSlice.actions;

export default posterSlice.reducer;
