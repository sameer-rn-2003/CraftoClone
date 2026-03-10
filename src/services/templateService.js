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
        backgroundColor: '#0D1B3E',
        accentColor: '#FF416C',
        headerColor: '#C0392B',
        footerColor: '#8B0000',
        pattern: 'diagonal',
        // ── Classic large circle, centred-top ──────────────────────
        photoFrame: { x: 75, y: 40, width: 250, height: 250, borderRadius: 125, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 315, fontSize: 28, fontWeight: '800', color: '#FFD700', align: 'center' },
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
        accentColor: '#FFD700',
        headerColor: '#5C0015',
        footerColor: '#8B0000',
        pattern: 'clean',
        // ── Small circle top-RIGHT, big name text top-left ─────────
        photoFrame: { x: 260, y: 22, width: 120, height: 120, borderRadius: 60, borderColor: '#FFD700', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 30, fieldWidth: 236, fontSize: 26, fontWeight: '900', color: '#FFD700', align: 'left' },
            { key: 'message', label: 'Your Slogan', x: 14, y: 80, fieldWidth: 236, fontSize: 13, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },

    {
        id: 'pol_04',
        name: 'Campaign Banner',
        category: 'political',
        layout: 'top',
        backgroundColor: '#05101F',
        accentColor: '#4A90E2',
        headerColor: '#0A1F3E',
        footerColor: '#1A3A6E',
        pattern: 'waves',
        // ── Full-width LANDSCAPE STRIP in the middle ────────────────
        photoFrame: { x: 20, y: 110, width: 360, height: 220, borderRadius: 0, borderColor: '#4A90E2', borderWidth: 2 },
        textFields: [
            { key: 'name', label: 'Candidate Name', y: 355, fontSize: 26, fontWeight: '800', color: '#FFFFFF', align: 'center' },
            { key: 'message', label: 'Your Tagline', y: 396, fontSize: 14, fontWeight: '400', color: '#A0C8FF', align: 'center' },
        ],
    },

    // ═══════════════════════════════════════════════════════════════
    // FESTIVAL  (4 templates)
    // ═══════════════════════════════════════════════════════════════

    {
        id: 'fes_01',
        name: 'Diwali Greetings',
        category: 'festival',
        layout: 'top',
        backgroundColor: '#1A0E00',
        accentColor: '#FFD200',
        headerColor: '#3D2000',
        footerColor: '#FF8C00',
        pattern: 'circles',
        // ── Classic circle, centred-top ────────────────────────────
        photoFrame: { x: 75, y: 40, width: 250, height: 250, borderRadius: 125, borderColor: '#FFD200', borderWidth: 5 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 316, fontSize: 26, fontWeight: '800', color: '#FFD200', align: 'center' },
            { key: 'message', label: 'Wishes…', y: 358, fontSize: 14, fontWeight: '400', color: '#FFF0C0', align: 'center' },
        ],
    },

    {
        id: 'fes_02',
        name: 'Eid Mubarak',
        category: 'festival',
        layout: 'left',
        backgroundColor: '#071A0F',
        accentColor: '#43E97B',
        headerColor: '#0A3020',   // left bar
        footerColor: '#1DB954',
        pattern: 'waves',
        // ── Oval PORTRAIT on the RIGHT side ────────────────────────
        photoFrame: { x: 228, y: 30, width: 155, height: 300, borderRadius: 78, borderColor: '#43E97B', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 120, fieldWidth: 204, fontSize: 24, fontWeight: '700', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Eid Wishes', x: 14, y: 168, fieldWidth: 204, fontSize: 13, fontWeight: '400', color: '#A8F0CA', align: 'left' },
        ],
    },

    {
        id: 'fes_03',
        name: 'Navratri Glory',
        category: 'festival',
        layout: 'top',
        backgroundColor: '#250030',
        accentColor: '#FF6BFF',
        headerColor: '#5A0070',
        footerColor: '#FF2EC4',
        pattern: 'diagonal',
        // ── BIG SQUARE / almost-full-width ─────────────────────────
        photoFrame: { x: 30, y: 55, width: 340, height: 290, borderRadius: 18, borderColor: '#FF6BFF', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 372, fontSize: 26, fontWeight: '800', color: '#FFEDFF', align: 'center' },
            { key: 'message', label: 'Wishes', y: 415, fontSize: 14, fontWeight: '400', color: '#FF6BFF', align: 'center' },
        ],
    },

    {
        id: 'fes_04',
        name: 'Holi Splash',
        category: 'festival',
        layout: 'top',
        backgroundColor: '#180022',
        accentColor: '#FF6584',
        headerColor: '#3A0045',
        footerColor: '#F7971E',
        pattern: 'circles',
        // ── Circle at BOTTOM-LEFT, heading text at top ──────────────
        photoFrame: { x: 14, y: 300, width: 190, height: 190, borderRadius: 95, borderColor: '#FF6584', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Your Name', y: 70, fontSize: 30, fontWeight: '900', color: '#FFD200', align: 'center' },
            { key: 'message', label: 'Happy Holi!', y: 118, fontSize: 16, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    // ═══════════════════════════════════════════════════════════════
    // BIRTHDAY  (4 templates)
    // ═══════════════════════════════════════════════════════════════

    {
        id: 'bday_01',
        name: 'Happy Birthday',
        category: 'birthday',
        layout: 'top',
        backgroundColor: '#1A0010',
        accentColor: '#FF6584',
        headerColor: '#3A0028',
        footerColor: '#FF8E53',
        pattern: 'dots',
        // ── Classic large circle, centred-top ──────────────────────
        photoFrame: { x: 75, y: 40, width: 250, height: 250, borderRadius: 125, borderColor: '#FF6584', borderWidth: 5 },
        textFields: [
            { key: 'name', label: 'Birthday Star', y: 318, fontSize: 26, fontWeight: '800', color: '#FF6584', align: 'center' },
            { key: 'message', label: 'Many Happy Returns!', y: 360, fontSize: 14, fontWeight: '400', color: '#FFFFFF', align: 'center' },
        ],
    },

    {
        id: 'bday_02',
        name: 'Party Night',
        category: 'birthday',
        layout: 'top',
        backgroundColor: '#08001A',
        accentColor: '#A18BFF',
        headerColor: '#160030',
        footerColor: '#6C63FF',
        pattern: 'clean',
        // ── LANDSCAPE STRIP at the top ──────────────────────────────
        //    (the "header" layer is behind; photo sits on top of it)
        photoFrame: { x: 16, y: 20, width: 368, height: 210, borderRadius: 14, borderColor: '#A18BFF', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Name', y: 252, fontSize: 28, fontWeight: '900', color: '#FFFFFF', align: 'center' },
            { key: 'message', label: 'Message', y: 296, fontSize: 14, fontWeight: '300', color: '#C0B8FF', align: 'center' },
        ],
    },

    {
        id: 'bday_03',
        name: 'Star of the Day',
        category: 'birthday',
        layout: 'top',
        backgroundColor: '#1F0015',
        accentColor: '#FF84A8',
        headerColor: '#4A0030',
        footerColor: '#C4167C',
        pattern: 'circles',
        // ── Small circle top-RIGHT + big name on LEFT ───────────────
        photoFrame: { x: 252, y: 22, width: 132, height: 132, borderRadius: 66, borderColor: '#FF84A8', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Happy Birthday', x: 14, y: 32, fieldWidth: 228, fontSize: 22, fontWeight: '900', color: '#FF84A8', align: 'left' },
            { key: 'message', label: 'So special! 🎉', x: 14, y: 92, fieldWidth: 228, fontSize: 13, fontWeight: '400', color: '#FFFFFF', align: 'left' },
        ],
    },

    {
        id: 'bday_04',
        name: 'Golden Celebration',
        category: 'birthday',
        layout: 'top',
        backgroundColor: '#1A1200',
        accentColor: '#FFD700',
        headerColor: '#2A1E00',
        footerColor: '#B8860B',
        pattern: 'clean',
        // ── Portrait rectangle centred ──────────────────────────────
        photoFrame: { x: 120, y: 55, width: 160, height: 280, borderRadius: 80, borderColor: '#FFD700', borderWidth: 4 },
        textFields: [
            { key: 'name', label: 'Name', y: 367, fontSize: 26, fontWeight: '800', color: '#FFD700', align: 'center' },
            { key: 'message', label: 'Message', y: 410, fontSize: 14, fontWeight: '400', color: '#FFF0C0', align: 'center' },
        ],
    },

    // ═══════════════════════════════════════════════════════════════
    // BUSINESS  (4 templates)
    // ═══════════════════════════════════════════════════════════════

    {
        id: 'biz_01',
        name: 'Corporate Pro',
        category: 'business',
        layout: 'top',
        backgroundColor: '#05050F',
        accentColor: '#6C63FF',
        headerColor: '#0A0A25',
        footerColor: '#4B44CC',
        pattern: 'clean',
        // ── Small circle centred, lots of breathing room ────────────
        photoFrame: { x: 140, y: 50, width: 120, height: 120, borderRadius: 60, borderColor: '#6C63FF', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Full Name', y: 198, fontSize: 24, fontWeight: '700', color: '#FFFFFF', align: 'center' },
            { key: 'message', label: 'Designation / Role', y: 238, fontSize: 14, fontWeight: '400', color: '#A0A0C0', align: 'center' },
        ],
    },

    {
        id: 'biz_02',
        name: 'Executive',
        category: 'business',
        layout: 'left',
        backgroundColor: '#080C12',
        accentColor: '#2F80ED',
        headerColor: '#0C1A30',   // left bar
        footerColor: '#1A5FBB',
        pattern: 'diagonal',
        // ── Portrait LEFT, text to the RIGHT ───────────────────────
        photoFrame: { x: 12, y: 50, width: 148, height: 320, borderRadius: 8, borderColor: '#2F80ED', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Founder Name', x: 175, y: 80, fieldWidth: 212, fontSize: 20, fontWeight: '700', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Company · Tagline', x: 175, y: 130, fieldWidth: 212, fontSize: 13, fontWeight: '400', color: '#90C8FF', align: 'left' },
        ],
    },

    {
        id: 'biz_03',
        name: 'Modern Brand',
        category: 'business',
        layout: 'top',
        backgroundColor: '#050505',
        accentColor: '#43E97B',
        headerColor: '#0A150C',
        footerColor: '#1DB954',
        pattern: 'waves',
        // ── Wide BANNER strip centre, text above & below ────────────
        photoFrame: { x: 20, y: 140, width: 360, height: 210, borderRadius: 6, borderColor: '#43E97B', borderWidth: 2 },
        textFields: [
            { key: 'name', label: 'Brand / Name', y: 70, fontSize: 26, fontWeight: '700', color: '#FFFFFF', align: 'center' },
            { key: 'message', label: 'Your Motto', y: 378, fontSize: 14, fontWeight: '400', color: '#A8F0CA', align: 'center' },
        ],
    },

    {
        id: 'biz_04',
        name: 'Minimal Right',
        category: 'business',
        layout: 'top',
        backgroundColor: '#07090E',
        accentColor: '#FC466B',
        headerColor: '#12050E',
        footerColor: '#9B0033',
        pattern: 'dots',
        // ── Portrait on the RIGHT, name text LEFT ───────────────────
        photoFrame: { x: 228, y: 40, width: 155, height: 285, borderRadius: 12, borderColor: '#FC466B', borderWidth: 3 },
        textFields: [
            { key: 'name', label: 'Your Name', x: 14, y: 70, fieldWidth: 204, fontSize: 22, fontWeight: '800', color: '#FFFFFF', align: 'left' },
            { key: 'message', label: 'Your Title', x: 14, y: 122, fieldWidth: 204, fontSize: 13, fontWeight: '400', color: '#FC466B', align: 'left' },
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
