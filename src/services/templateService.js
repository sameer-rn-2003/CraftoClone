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
const W = 300;   // poster width
const H = 300;   // poster height

export const TEMPLATES = [

    // ═══════════════════════════════════════════════════════════════
    // POLITICAL  (4 templates)
    // ═══════════════════════════════════════════════════════════════

    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        width: W,
        height: H,
        Image: require("../assets/images/image-1.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 45, y: 45, width: 210, height: 210, borderRadius: 105, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 20, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 260, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        width: W,
        height: H,
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/image-2.jpg"),
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'diagonal',

        photoFrame: { x: 16, y: 54, width: 110, height: 192, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 140, y: 92, fieldWidth: 145, fontSize: 20, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 140, y: 132, fieldWidth: 145, fontSize: 12, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        width: W,
        height: H,
        backgroundColor: '#1A0005',
        Image: require("../assets/images/image-4.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 12, y: 18, width: 90, height: 90, borderRadius: 45, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 112, y: 34, fieldWidth: 170, fontSize: 22, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 112, y: 72, fieldWidth: 170, fontSize: 12, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },
    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        width: W,
        height: H,
        Image: require("../assets/images/image-1.jpg"),
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 45, y: 45, width: 210, height: 210, borderRadius: 105, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 20, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 260, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        width: W,
        height: H,
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/image-2.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'diagonal',

        photoFrame: { x: 16, y: 54, width: 110, height: 192, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 140, y: 92, fieldWidth: 145, fontSize: 20, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 140, y: 132, fieldWidth: 145, fontSize: 12, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        width: W,
        height: H,
        backgroundColor: '#1A0005',
        Image: require("../assets/images/image-4.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 12, y: 18, width: 90, height: 90, borderRadius: 45, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 112, y: 34, fieldWidth: 170, fontSize: 22, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 112, y: 72, fieldWidth: 170, fontSize: 12, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },
    {
        id: 'pol_01',
        name: 'Election Rally',
        category: 'political',
        layout: 'top',
        width: W,
        height: H,
        Image: require("../assets/images/image-1.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        photoFrame: { x: 45, y: 45, width: 210, height: 210, borderRadius: 105, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 20, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Your Slogan', y: 260, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'pol_02',
        name: 'Presidential',
        category: 'political',
        layout: 'left',
        width: W,
        height: H,
        backgroundColor: '#0A1824',
        accentColor: '#F7921E',
        Image: require("../assets/images/image-2.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        headerColor: '#1B3A56',   // used as left bar colour
        footerColor: '#0D2235',
        pattern: 'diagonal',

        photoFrame: { x: 16, y: 54, width: 110, height: 192, borderRadius: 12, borderColor: '#F7921E', borderWidth: 3 },
        textFields: [
            // Text sits to the RIGHT of the photo
            { key: 'name', label: 'Leader Name', x: 140, y: 92, fieldWidth: 145, fontSize: 20, fontWeight: '900', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Vision →', x: 140, y: 132, fieldWidth: 145, fontSize: 12, fontWeight: '400', color: '#F7921E', align: 'left' },
        ],
    },

    {
        id: 'pol_03',
        name: 'People Power',
        category: 'political',
        layout: 'top',
        width: W,
        height: H,
        backgroundColor: '#1A0005',
        Image: require("../assets/images/image-4.jpg"),
        Video:"https://www.w3schools.com/html/movie.mp4",
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 12, y: 18, width: 90, height: 90, borderRadius: 45, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 112, y: 34, fieldWidth: 170, fontSize: 22, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 112, y: 72, fieldWidth: 170, fontSize: 12, fontWeight: '400', color: '#FFFFFF', align: 'left' },
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
