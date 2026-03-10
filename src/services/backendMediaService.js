// src/services/backendMediaService.js
// Fetches TEMPLATES from your backend API.
// Each template includes the full poster layout:
//   - photoFrame: { x, y, width, height, borderRadius, ... }
//   - textFields: [{ key:'name', y, fontSize, ... }, { key:'message', ... }]
//
// ╔══════════════════════════════════════════════════════════╗
// ║  HOW TO CONNECT YOUR REAL BACKEND                        ║
// ║                                                          ║
// ║  1. Set BASE_URL to your API base URL.                   ║
// ║  2. Set TEMPLATES_ENDPOINT to your templates list path.  ║
// ║  3. Edit transform() to map your response fields.        ║
// ║  4. Set AUTH_TOKEN if your API is authenticated.         ║
// ╚══════════════════════════════════════════════════════════╝

const BASE_URL = 'https://your-api.example.com';  // ← change
const TEMPLATES_ENDPOINT = '/api/templates';               // ← change
const AUTH_TOKEN = '';                              // ← add if needed

// ─── Transform ────────────────────────────────────────────────────
// Map ONE item from your API response → internal template shape.
// Poster canvas is always 400 × 560 px.
// All x, y, width, height values must be in that coordinate space.
const transform = item => ({
    // ── Identity ──────────────────────────────────────────────────
    id: String(item.id ?? item._id ?? Math.random()),
    name: item.name ?? item.title ?? 'Untitled',
    category: item.category ?? 'general',

    // ── Colors ────────────────────────────────────────────────────
    backgroundColor: item.background_color ?? item.backgroundColor ?? '#0D0D0D',
    accentColor: item.accent_color ?? item.accentColor ?? '#7C6FFF',
    headerColor: item.header_color ?? item.headerColor ?? '#1A1A2E',
    footerColor: item.footer_color ?? item.footerColor ?? '#16213E',

    // ── Layout ────────────────────────────────────────────────────
    layout: item.layout ?? 'top',       // 'top' | 'left'
    pattern: item.pattern ?? 'clean',     // 'clean'|'diagonal'|'dots'|'circles'|'waves'

    // ── Photo frame ───────────────────────────────────────────────
    // THIS is what tells the frontend WHERE the photo goes on the poster.
    // x, y = top-left corner in poster space (0-400, 0-560)
    photoFrame: {
        x: item.photo_frame?.x ?? item.photoFrame?.x ?? 75,
        y: item.photo_frame?.y ?? item.photoFrame?.y ?? 40,
        width: item.photo_frame?.width ?? item.photoFrame?.width ?? 250,
        height: item.photo_frame?.height ?? item.photoFrame?.height ?? 250,
        borderRadius: item.photo_frame?.border_radius ?? item.photoFrame?.borderRadius ?? 125,
        borderColor: item.photo_frame?.border_color ?? item.photoFrame?.borderColor ?? '#FFD700',
        borderWidth: item.photo_frame?.border_width ?? item.photoFrame?.borderWidth ?? 4,
    },

    // ── Text fields (name + message positions) ─────────────────────
    // key:'name'    → user's name text
    // key:'message' → user's message / tagline text
    // y = vertical position from top of poster (in poster space)
    // x, fieldWidth = optional horizontal constraints
    textFields: (item.text_fields ?? item.textFields ?? [
        // Default (centred) if backend doesn't send textFields
        { key: 'name', label: 'Your Name', y: 316, fontSize: 26, fontWeight: '800', color: '#FFFFFF', align: 'center' },
        { key: 'message', label: 'Your Message', y: 358, fontSize: 14, fontWeight: '400', color: '#CCCCCC', align: 'center' },
    ]).map(f => ({
        key: f.key,
        label: f.label ?? (f.key === 'name' ? 'Your Name' : 'Your Message'),
        y: f.y,
        x: f.x,                            // optional left offset
        fieldWidth: f.field_width ?? f.fieldWidth,  // optional explicit width
        fontSize: f.font_size ?? f.fontSize ?? 22,
        fontWeight: f.font_weight ?? f.fontWeight ?? '700',
        color: f.color ?? '#FFFFFF',
        align: f.align ?? 'center',
    })),
});

// ─── Fetch function ────────────────────────────────────────────────
/**
 * Fetch templates from the backend.
 * @param {{ page?: number, limit?: number, category?: string }} options
 * @returns {Promise<Array<Template>>}
 */
export const fetchBackendTemplates = async ({ page = 1, limit = 20, category = 'all' } = {}) => {
    const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(category !== 'all' ? { category } : {}),
    });

    const url = `${BASE_URL}${TEMPLATES_ENDPOINT}?${qs}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    // Support common envelopes: { data:[] } | { items:[] } | { templates:[] } | plain []
    const raw = Array.isArray(json)
        ? json
        : json.data ?? json.items ?? json.templates ?? json.results ?? [];

    return raw.map(transform);
};
