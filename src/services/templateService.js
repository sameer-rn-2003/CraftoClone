// src/services/templateService.js
// 16 configuration-driven templates across 4 categories.
// POSTER COORDINATE SPACE: 400 × 560 px (all x, y, width, height in these units).
//
// photoFrame : { x, y, width, height, borderRadius, borderColor, borderWidth }
//              ── absolute top-left corner in poster space ──
//
// textFields : each field can override layout with:
//              x (left offset, default 16)
//              fieldWidth (explicit width, otherwise stretches to right edge)
//              rightPad (right margin when no fieldWidth, default 16)
//
// layout: 'top'  → coloured header band at top  (default)
//         'left' → coloured bar on left side

// ─── Poster metrics ──────────────────────────────────────────────
const W = 400;   // poster width
const H = 560;   // poster height

export const TEMPLATES = [

    // ═══════════════════════════════════════════════════════════════
    // POLITICAL  (4 templates)
    // ═══════════════════════════════════════════════════════════════

    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        Image: require("../assets/images/happydiwali.jpg"),
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 65, y: 110, width: 250, height: 250, borderRadius: 125, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 20, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 358, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/happydiwali2.jpg"),
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'diagonal',
        // ── Tall portrait on the LEFT third ────────────────────────
        //    x: 12  ─── left bar occupies ~160px ───────────────────
        photoFrame: { x: 0, y:100, width: 148, height: 360, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 174, y: 100, fieldWidth: 212, fontSize: 22, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 174, y: 152, fieldWidth: 212, fontSize: 13, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        backgroundColor: '#1A0005',
        Image: require("../assets/images/happydiwali4.jpg"),
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 0, y: 22, width: 120, height: 120, borderRadius: 60, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 30, fieldWidth: 236, fontSize: 26, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 14, y: 80, fieldWidth: 236, fontSize: 13, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },

    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        Image: require("../assets/images/happydiwali.jpg"),
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 75, y: 40, width: 250, height: 250, borderRadius: 125, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 0, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 358, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/happydiwali2.jpg"),
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'diagonal',
        // ── Tall portrait on the LEFT third ────────────────────────
        //    x: 12  ─── left bar occupies ~160px ───────────────────
        photoFrame: { x: 12, y: 40, width: 148, height: 360, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 174, y: 100, fieldWidth: 212, fontSize: 22, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 174, y: 152, fieldWidth: 212, fontSize: 13, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        backgroundColor: '#1A0005',
        Image: require("../assets/images/happydiwali4.jpg"),
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 0, y: 22, width: 120, height: 120, borderRadius: 60, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 30, fieldWidth: 236, fontSize: 26, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 14, y: 80, fieldWidth: 236, fontSize: 13, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },
    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        Image: require("../assets/images/happydiwali.jpg"),
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 75, y: 40, width: 250, height: 250, borderRadius: 125, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 0, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 358, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/happydiwali2.jpg"),
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'dots',
        // ── Tall portrait on the LEFT third ────────────────────────
        //    x: 12  ─── left bar occupies ~160px ───────────────────
        photoFrame: { x: 12, y: 40, width: 148, height: 360, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 174, y: 100, fieldWidth: 212, fontSize: 22, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 174, y: 152, fieldWidth: 212, fontSize: 13, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        backgroundColor: '#1A0005',
        Image: require("../assets/images/happydiwali4.jpg"),
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'clean',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 0, y: 22, width: 120, height: 120, borderRadius: 60, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 30, fieldWidth: 236, fontSize: 26, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 14, y: 80, fieldWidth: 236, fontSize: 13, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },
    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        Image: require("../assets/images/happydiwali.jpg"),
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 75, y: 40, width: 250, height: 250, borderRadius: 125, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 0, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 358, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/happydiwali2.jpg"),
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'dots',
        // ── Tall portrait on the LEFT third ────────────────────────
        //    x: 12  ─── left bar occupies ~160px ───────────────────
        photoFrame: { x: 12, y: 40, width: 148, height: 360, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 174, y: 100, fieldWidth: 212, fontSize: 22, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 174, y: 152, fieldWidth: 212, fontSize: 13, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        backgroundColor: '#1A0005',
        Image: require("../assets/images/happydiwali4.jpg"),
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'clean',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 0, y: 22, width: 120, height: 120, borderRadius: 60, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 30, fieldWidth: 236, fontSize: 26, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 14, y: 80, fieldWidth: 236, fontSize: 13, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },

];

// ─── Helpers ─────────────────────────────────────────────────────

export const getTemplatesByCategory = categoryId => {
    if (!categoryId || categoryId === 'all') return TEMPLATES;
    return TEMPLATES.filter(t => t.category === categoryId);
};

export const getTemplateById = id =>
    TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
