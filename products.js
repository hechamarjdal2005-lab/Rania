/* ============================================================================
   products.js — SOURCE OF TRUTH FOR THE CATALOGUE
   ---------------------------------------------------------------------------
   Everything the shop renders comes from PRODUCTS below. To add a piece, add one
   object. To change a price, change one number. Nothing else to touch — the
   homepage "Nouveautés" rail, the shop grid, the filters and the cart all read
   from this array.
   ---------------------------------------------------------------------------
   IMG HELPER — swap any `img('photo-id')` for your own file path later:
       img('1490481651871-ab68de25d43d')  →  Unsplash, optimised crop
       img('photo.jpg')                    →  local file in /images
   ========================================================================== */

/** Build an image URL. Bare id → Unsplash. Anything with a dot/slash → as-is. */
function img(src, w) {
  if (/[./]/.test(src) && !/^\d/.test(src)) return src;
  return 'https://images.unsplash.com/photo-' + src +
         '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
}

/* ── CATEGORIES ────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'robes',       name: 'Robes',          count: 42, img: '1595777457583-95e059d581b8' },
  { id: 'ensembles',   name: 'Ensembles',      count: 26, img: '1552374196-c4e7ffc6e126' },
  { id: 'hauts',       name: 'Hauts & Tops',   count: 31, img: '1529626455594-4ff0802cfb7e' },
  { id: 'abayas',      name: 'Abayas & Kaftans', count: 18, img: '1566174053879-31528523f8ae' },
  { id: 'accessoires', name: 'Accessoires',    count: 24, img: '1611312449408-fcece27cdbb7' }
];

/* ── PRODUCTS ────────────────────────────────────────────────────────────
   id     : unique slug (used in localStorage cart lines)
   name   : display name
   price  : current price in MAD
   old    : previous price (optional → renders a struck-through price + Promo badge)
   badge  : 'Nouveau' | 'Promo' | null   (null → auto-derived from `old`)
   cat    : must match a CATEGORIES id
   ─────────────────────────────────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 'robe-noir-nuances',
    name: 'Robe midi « Noctuance »',
    price: 349, old: 450,
    badge: 'Promo', cat: 'robes',
    img: '1595777457583-95e059d581b8',
    note: 'Satiné, taille unique'
  },
  {
    id: 'ensemble-champagne',
    name: 'Ensemble tailleur « Champagne »',
    price: 520, old: null,
    badge: 'Nouveau', cat: 'ensembles',
    img: '1552374196-c4e7ffc6e126',
    note: 'Blazer + jupe plissée'
  },
  {
    id: 'top-satin-nude',
    name: 'Top satin « Nude »',
    price: 189, old: null,
    badge: 'Nouveau', cat: 'hauts',
    img: '1529626455594-4ff0802cfb7e',
    note: 'Drapé à l’épaule'
  },
  {
    id: 'abaya-perles',
    name: 'Abaya brodée « Perles »',
    price: 690, old: 850,
    badge: 'Promo', cat: 'abayas',
    img: '1566174053879-31528523f8ae',
    note: 'Broderie main, mousseline'
  },
  {
    id: 'sac-cuir-taupe',
    name: 'Sac cabas cuir « Taupe »',
    price: 249, old: null,
    badge: null, cat: 'accessoires',
    img: '1611312449408-fcece27cdbb7',
    note: 'Cuir véritable'
  },
  {
    id: 'robe-fleuri-ivoire',
    name: 'Robe fleurie « Ivoire »',
    price: 399, old: null,
    badge: 'Nouveau', cat: 'robes',
    img: '1515372039744-b8f02a3ae446',
    note: 'Vola Fiorentina, été'
  },
  {
    id: 'ensemble-lin-blanc',
    name: 'Ensemble lin « Blanc Giselle »',
    price: 379, old: null,
    badge: null, cat: 'ensembles',
    img: '1495385794356-15371f348c31',
    note: 'Lin lavé, respirant'
  },
  {
    id: 'top-col-vierge',
    name: 'Col montant « Vierge »',
    price: 149, old: 190,
    badge: 'Promo', cat: 'hauts',
    img: '1509631179647-0177331693ae',
    note: 'Maille côtelée'
  },
  {
    id: 'kaftan-velours',
    name: 'Caftan velours « Velours Noir »',
    price: 950, old: null,
    badge: 'Nouveau', cat: 'abayas',
    img: '1543163521-1bf539c55dd2',
    note: 'Col paillettes, fente latérale'
  },
  {
    id: 'foulard-soie',
    name: 'Foulard de soie « Éclat »',
    price: 129, old: null,
    badge: null, cat: 'accessoires',
    img: '1594633312681-425c7b97ccd1',
    note: 'Imprimé exclusif'
  },
  {
    id: 'robe-plissee-taupe',
    name: 'Robe plissée « Taupe »',
    price: 429, old: null,
    badge: null, cat: 'robes',
    img: '1550928431-ee0ec6db30d3',
    note: 'Plis soleil, longue'
  },
  {
    id: 'ensemble-velours-bordeaux',
    name: 'Ensemble « Bordeaux »',
    price: 580, old: 690,
    badge: 'Promo', cat: 'ensembles',
    img: '1578587018452-892bacefd3f2',
    note: 'Velours côtelé'
  },
  {
    id: 'top-dentelle-noire',
    name: 'Top dentelle « Nuit »',
    price: 169, old: null,
    badge: 'Nouveau', cat: 'hauts',
    img: '1596993100471-c3905dafa78e',
    note: 'Dentelle française'
  },
  {
    id: 'abaya-creations-rania',
    name: 'Abaya « Créations Rania »',
    price: 780, old: null,
    badge: null, cat: 'abayas',
    img: '1601049541289-9b1b7bbbfe19',
    note: 'Pièce exclusive'
  },
  {
    id: 'bracelet-dore',
    name: 'Bracelet doré « Lumière »',
    price: 99, old: 130,
    badge: 'Promo', cat: 'accessoires',
    img: '1596755094514-f87e34085b2c',
    note: 'Acier inoxydable'
  },
  {
    id: 'robe-soie-champagne',
    name: 'Robe soie « Lumière »',
    price: 620, old: null,
    badge: 'Nouveau', cat: 'robes',
    img: '1508214751196-bcfd4ca60f91',
    note: 'Soie naturelle'
  },
  {
    id: 'robe-drapee-argent',
    name: 'Robe drapée « Argent »',
    price: 470, old: null,
    badge: null, cat: 'robes',
    img: '1515886657613-9f3515b0c78f',
    note: 'Effet liquide'
  },
  {
    id: 'top-soyeux-ecru',
    name: 'Top soyeux « Écru »',
    price: 179, old: null,
    badge: null, cat: 'hauts',
    img: '1483985988355-763728e1935b8',
    note: 'Coupe droite'
  }
];

/* ── HELPERS ───────────────────────────────────────────────────────────── */

/** Products flagged "Nouveau", newest first, capped at `n`. */
function featuredProducts(n) {
  return PRODUCTS.filter(p => p.badge === 'Nouveau').slice(0, n || 6);
}

/** Look a product up by id (used by the cart to rehydrate saved lines). */
function getProduct(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}

/** Format a MAD amount: 350 → "350 DH" */
function priceFmt(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DH';
}

/** Effective badge for a product (auto "Promo" when it has a struck price). */
function badgeOf(p) {
  return p.badge || (p.old ? 'Promo' : null);
}