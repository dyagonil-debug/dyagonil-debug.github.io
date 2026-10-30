// ============================================================================
// SUBTERRANEAN ASCENSION — ON-THEME SVG ICON REGISTRY & AUTO-HYDRATOR
// (js/ui/iconSystem.js)
// Dynamically builds 64x64 carved obsidian SVG medallions from compact vector
// specs, replaces catalog emojis & HUD icons, and preloads 2D Roulette images.
// ============================================================================

// Compact Vector Specification Table: [rimColor, gradStart, gradEnd, foregroundSvgMarkup]
const C4_MEDALLION_SPECS = {
  cards: {
    pebble: [
      '#f59e0b', '#fbbf24', '#b45309',
      '<polygon points="18,42 24,26 38,22 48,32 44,45 26,47" fill="url(#grad)" stroke="#fef3c7" stroke-width="1.8" stroke-linejoin="round"/><polyline points="24,26 33,35 48,32" stroke="#78350f" stroke-width="1.6" fill="none"/><polyline points="33,35 26,47" stroke="#78350f" stroke-width="1.6" fill="none"/><path d="M18 18 L21 13 M44 17 L48 13 M32 15 L32 10" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>'
    ],
    oracle_peek: [
      '#fbbf24', '#fde047', '#ca8a04',
      '<path d="M26 14 H38 M32 14 V19" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/><polygon points="22,20 42,20 46,44 18,44" fill="#1c1917" stroke="url(#grad)" stroke-width="2.2" stroke-linejoin="round"/><circle cx="32" cy="32" r="7" fill="url(#grad)"/><ellipse cx="32" cy="32" rx="10" ry="5.5" stroke="#fef08a" stroke-width="1.5" fill="none"/><circle cx="32" cy="32" r="2.5" fill="#070609"/><path d="M20 48 H44" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>'
    ],
    petrified: [
      '#78716c', '#a8a29e', '#57534e',
      '<rect x="18" y="18" width="28" height="28" rx="5" fill="url(#grad)" stroke="#e7e5e4" stroke-width="1.8"/><circle cx="32" cy="32" r="9" stroke="#292524" stroke-width="1.8" stroke-dasharray="6 3" fill="none"/><circle cx="32" cy="32" r="4" stroke="#292524" stroke-width="1.5" fill="none"/><path d="M22 22 L28 28 M42 38 L35 34" stroke="#44403c" stroke-width="1.8" stroke-linecap="round"/>'
    ],
    pickaxe: [
      '#f59e0b', '#38bdf8', '#0284c7',
      '<line x1="18" y1="46" x2="42" y2="22" stroke="#d97706" stroke-width="4" stroke-linecap="round"/><path d="M25 17 C33 13, 45 19, 49 27 C43 24, 34 21, 25 17 Z" fill="url(#grad)" stroke="#e0f2fe" stroke-width="1.8" stroke-linejoin="round"/><circle cx="38" cy="24" r="2.5" fill="#fbbf24"/><path d="M46 14 L50 12 M51 19 L54 18" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>'
    ],
    tectonic_anchor: [
      '#fbbf24', '#fde047', '#b45309',
      '<path d="M16 14 H48 M16 50 H48" stroke="#fde047" stroke-width="3" stroke-linecap="round"/><polygon points="22,17 42,17 36,32 42,47 22,47 28,32" fill="url(#grad)" stroke="#fef9c3" stroke-width="1.8" stroke-linejoin="round"/><polygon points="32,25 38,32 32,39 26,32" fill="#38bdf8" stroke="#ffffff" stroke-width="1.4"/>'
    ],
    sinkhole_chute: [
      '#fb923c', '#f97316', '#9a3412',
      '<rect x="14" y="16" width="36" height="8" rx="2" fill="#44403c" stroke="#fb923c" stroke-width="1.6"/><path d="M16 24 L10 36 M48 24 L54 36" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="34" r="4.5" fill="#fbbf24" stroke="#fef3c7" stroke-width="1.2"/><circle cx="38" cy="39" r="4.5" fill="#2dd4bf" stroke="#ccfbf1" stroke-width="1.2"/><circle cx="30" cy="47" r="4.5" fill="#fbbf24" stroke="#fef3c7" stroke-width="1.2"/><path d="M24 26 V29 M38 28 V33 M30 36 V41" stroke="#fdba74" stroke-width="1.6" stroke-dasharray="2 2"/>'
    ],
    lodestone: [
      '#38bdf8', '#f43f5e', '#0284c7',
      '<path d="M20 24 V35 C20 43, 44 43, 44 35 V24" stroke="url(#grad)" stroke-width="6.5" stroke-linecap="round" fill="none"/><rect x="16.5" y="19" width="7" height="6" rx="1.5" fill="#e2e8f0"/><rect x="40.5" y="19" width="7" height="6" rx="1.5" fill="#e2e8f0"/><circle cx="32" cy="16" r="5" fill="#fbbf24" stroke="#fef9c3" stroke-width="1.6"/><path d="M25 14 L28 11 M39 14 L36 11" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>'
    ],
    alchemy_crucible: [
      '#e879f9', '#c084fc', '#0284c7',
      '<path d="M26 14 H38 M28 14 V22 L17 40 C15 44, 18 49, 23 49 H41 C46 49, 49 44, 47 40 L36 22 V14" fill="#1e1b24" stroke="url(#grad)" stroke-width="2.2" stroke-linejoin="round"/><path d="M20 41 Q32 37 44 41 L45 45 C44 48, 20 48, 19 45 Z" fill="#fbbf24"/><polygon points="32,23 38,31 32,39 26,31" fill="#38bdf8" stroke="#fef08a" stroke-width="1.5"/><circle cx="25" cy="20" r="2" fill="#fde047"/><circle cx="39" cy="19" r="1.6" fill="#e879f9"/>'
    ],
    inversion: [
      '#38bdf8', '#2dd4bf', '#a855f7',
      '<path d="M22 44 V20 L16 26 M42 20 V44 L48 38" stroke="url(#grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="32" cy="32" rx="16" ry="7" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="4 3" fill="none"/><circle cx="32" cy="24" r="3.5" fill="#fbbf24"/><circle cx="32" cy="40" r="3.5" fill="#2dd4bf"/>'
    ],
    transmute: [
      '#f472b6', '#e879f9', '#f59e0b',
      '<polygon points="32,12 48,32 32,52 16,32" fill="url(#grad)" stroke="#fef3c7" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="32" r="7" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5"/><path d="M16 16 L20 20 M48 16 L44 20 M16 48 L20 44 M48 48 L44 44" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>'
    ],
    hibachi: [
      '#fb923c', '#f97316', '#dc2626',
      '<path d="M32 12 C38 22, 46 25, 43 37 C41 44, 35 48, 32 48 C29 48, 23 44, 21 37 C18 25, 26 22, 32 12 Z" fill="url(#grad)" stroke="#fde047" stroke-width="1.8"/><path d="M32 24 C35 30, 38 33, 36 40 C35 43, 33 45, 32 45 C31 45, 29 43, 28 40 C26 33, 29 30, 32 24 Z" fill="#fef08a"/><path d="M16 50 H48" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>'
    ],
    echo_drop: [
      '#fde047', '#fbbf24', '#d97706',
      '<circle cx="32" cy="23" r="9.5" fill="url(#grad)" stroke="#fef3c7" stroke-width="2"/><circle cx="32" cy="42" r="9.5" fill="url(#grad)" stroke="#fef3c7" stroke-width="2"/><circle cx="32" cy="23" r="4.5" stroke="#78350f" stroke-width="1.5" fill="none"/><circle cx="32" cy="42" r="4.5" stroke="#78350f" stroke-width="1.5" fill="none"/>'
    ],
    mirror_shard: [
      '#f0abfc', '#38bdf8', '#e879f9',
      '<polygon points="27,11 47,19 39,51 17,43" fill="url(#grad)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><line x1="23" y1="39" x2="41" y2="21" stroke="#fef08a" stroke-width="1.8" stroke-dasharray="3 2"/><circle cx="27" cy="40" r="4.2" fill="#fbbf24" stroke="#fef3c7" stroke-width="1.3"/><polygon points="35,17 41,23 35,29 29,23" fill="#fef08a" stroke="#ffffff" stroke-width="1.3"/>'
    ],
    abyssal_upheaval: [
      '#a855f7', '#c084fc', '#f43f5e',
      '<rect x="20" y="20" width="24" height="24" rx="4" fill="#1e1b24" stroke="url(#grad)" stroke-width="2.2" transform="rotate(15 32 32)"/><path d="M14 28 A18 18 0 0 1 48 22" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" fill="none"/><polygon points="49,17 51,25 43,24" fill="#38bdf8"/><path d="M50 36 A18 18 0 0 1 16 42" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" fill="none"/><polygon points="15,47 13,39 21,40" fill="#fbbf24"/>'
    ],
    jar_of_flies: [
      '#84cc16', '#a3e635', '#4d7c0f',
      '<rect x="24" y="13" width="16" height="5" rx="1.5" fill="#d97706" stroke="#fef3c7" stroke-width="1.4"/><path d="M21 18 H43 L46 24 V46 C46 49, 43 51, 40 51 H24 C21 51, 18 49, 18 46 V24 Z" fill="#14261c" fill-opacity="0.8" stroke="#a3e635" stroke-width="2"/><circle cx="27" cy="31" r="2.3" fill="#fde047"/><ellipse cx="25" cy="29" rx="2.5" ry="1.2" fill="#ecfccb" transform="rotate(-30 25 29)"/><circle cx="37" cy="36" r="2.3" fill="#fde047"/><ellipse cx="39" cy="34" rx="2.5" ry="1.2" fill="#ecfccb" transform="rotate(30 39 34)"/><circle cx="31" cy="43" r="2.3" fill="#a3e635"/>'
    ],
    brimstone_beam: [
      '#f43f5e', '#ef4444', '#991b1b',
      '<rect x="25" y="10" width="14" height="44" fill="url(#grad)" opacity="0.85"/><rect x="29" y="10" width="6" height="44" fill="#fef08a"/><path d="M22 18 H42 M20 32 H44 M22 46 H42" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/><circle cx="32" cy="32" r="9" stroke="#fde047" stroke-width="1.8" fill="none"/>'
    ],
    dead_weight: [
      '#a855f7', '#78716c', '#4c1d95',
      '<polygon points="16,46 20,24 32,18 44,24 48,46" fill="url(#grad)" stroke="#c4b5fd" stroke-width="2" stroke-linejoin="round"/><path d="M27 18 C27 12, 37 12, 37 18" stroke="#e9d5ff" stroke-width="2.5" fill="none"/><path d="M28 31 L36 39 M36 31 L28 39" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>'
    ],
    tremor: [
      '#f59e0b', '#f97316', '#78350f',
      '<polygon points="12,48 26,22 36,36 42,26 52,48" fill="url(#grad)" stroke="#fed7aa" stroke-width="1.8" stroke-linejoin="round"/><polyline points="26,22 29,33 24,40 31,48" stroke="#fde047" stroke-width="2.2" fill="none"/>'
    ],
    stalactite: [
      '#7dd3fc', '#38bdf8', '#0369a1',
      '<polygon points="20,12 44,12 32,50" fill="url(#grad)" stroke="#e0f2fe" stroke-width="2" stroke-linejoin="round"/><line x1="32" y1="12" x2="32" y2="44" stroke="#bae6fd" stroke-width="1.5"/><circle cx="32" cy="52" r="2.5" fill="#fde047"/>'
    ]
  },

  reserves: {
    fools_penny: [
      '#facc15', '#eab308', '#a16207',
      '<circle cx="32" cy="32" r="18" fill="url(#grad)" stroke="#fef08a" stroke-width="2.2"/><circle cx="32" cy="32" r="13" stroke="#713f12" stroke-width="1.5" stroke-dasharray="4 2" fill="none"/><polyline points="28,15 34,27 29,34 36,48" stroke="#422006" stroke-width="2.2" fill="none"/><text x="32" y="37" text-anchor="middle" fill="#fef9c3" font-family="monospace" font-weight="bold" font-size="15">&#162;</text>'
    ],
    anvil: [
      '#cbd5e1', '#94a3b8', '#334155',
      '<path d="M14 24 H46 C50 24, 52 28, 46 31 H38 L42 44 H22 L26 31 H18 C14 30, 12 27, 14 24 Z" fill="url(#grad)" stroke="#f8fafc" stroke-width="2" stroke-linejoin="round"/><rect x="18" y="44" width="28" height="5" rx="1.5" fill="#475569" stroke="#e2e8f0" stroke-width="1.5"/><path d="M26 16 L32 22 L38 16" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
    ],
    cave_bat: [
      '#e879f9', '#c084fc', '#581c87',
      '<path d="M10 26 C16 20, 23 23, 27 28 L32 22 L37 28 C41 23, 48 20, 54 26 C49 33, 44 33, 41 38 C37 35, 34 37, 32 43 C30 37, 27 35, 23 38 C20 33, 15 33, 10 26 Z" fill="url(#grad)" stroke="#f5d0fe" stroke-width="1.8" stroke-linejoin="round"/><circle cx="29" cy="29" r="1.5" fill="#fde047"/><circle cx="35" cy="29" r="1.5" fill="#fde047"/>'
    ],
    wild: [
      '#f0abfc', '#e879f9', '#38bdf8',
      '<polygon points="32,11 49,26 42,49 22,49 15,26" fill="url(#grad)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><polygon points="32,19 41,28 37,42 27,42 23,28" fill="#fef08a" fill-opacity="0.35" stroke="#ffffff" stroke-width="1.2"/><circle cx="32" cy="32" r="4" fill="#ffffff"/>'
    ],
    jalapeno_bomb: [
      '#f97316', '#ef4444', '#b91c1c',
      '<path d="M24 22 C20 30, 23 44, 34 49 C42 52, 46 45, 43 38 C39 31, 34 22, 24 22 Z" fill="url(#grad)" stroke="#fecaca" stroke-width="1.8"/><path d="M24 22 C22 17, 26 14, 31 15" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="34" cy="14" r="3" fill="#fde047"/><path d="M34 9 V19 M29 14 H39" stroke="#f97316" stroke-width="1.8" stroke-linecap="round"/>'
    ],
    midas_eye: [
      '#fde047', '#facc15', '#b45309',
      '<path d="M12 32 C20 19, 44 19, 52 32 C44 45, 20 45, 12 32 Z" fill="url(#grad)" stroke="#fef9c3" stroke-width="2.2" stroke-linejoin="round"/><circle cx="32" cy="32" r="7.5" fill="#1c1917" stroke="#fde047" stroke-width="1.8"/><polygon points="32,27 36,32 32,37 28,32" fill="#38bdf8"/><path d="M32 13 V17 M32 47 V51 M19 18 L22 21 M45 18 L42 21" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>'
    ]
  },

  gambits: {
    butter_crust: [
      '#fde047', '#fbbf24', '#d97706',
      '<path d="M18 18 C28 14, 42 18, 48 28 L20 48 Z" fill="url(#grad)" stroke="#fef3c7" stroke-width="2" stroke-linejoin="round"/><path d="M16 17 C28 12, 44 16, 50 28" stroke="#b45309" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="31" cy="29" r="3.2" fill="#dc2626"/><circle cx="26" cy="37" r="2.6" fill="#dc2626"/><circle cx="37" cy="34" r="2.4" fill="#fef08a"/>'
    ],
    shrinking_shroom: [
      '#84cc16', '#a3e635', '#15803d',
      '<path d="M16 32 C16 18, 48 18, 48 32 Z" fill="url(#grad)" stroke="#ecfccb" stroke-width="2" stroke-linejoin="round"/><path d="M27 32 V46 C27 49, 37 49, 37 46 V32" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/><circle cx="25" cy="25" r="2.8" fill="#fef08a"/><circle cx="36" cy="23" r="2.2" fill="#fef08a"/><circle cx="41" cy="28" r="1.8" fill="#fef08a"/>'
    ],
    dali_clock: [
      '#2dd4bf', '#38bdf8', '#fbbf24',
      '<path d="M18 24 C18 15, 46 15, 46 25 C46 33, 41 37, 42 45 C43 50, 32 52, 28 47 C25 43, 27 36, 21 33 C17 31, 18 27, 18 24 Z" fill="url(#grad)" stroke="#fef9c3" stroke-width="2"/><polyline points="32,22 32,31 39,35" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="32" cy="31" r="2" fill="#0f172a"/>'
    ],
    echo_bell: [
      '#fde047', '#fbbf24', '#b45309',
      '<path d="M32 14 C23 14, 19 22, 19 33 L15 41 H49 L45 33 C45 22, 41 14, 32 14 Z" fill="url(#grad)" stroke="#fef3c7" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="45" r="4" fill="#fde047"/><path d="M12 24 C9 29, 9 35, 12 40 M52 24 C55 29, 55 35, 52 40" stroke="#2dd4bf" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
    ],
    coaster_apex: [
      '#38bdf8', '#2dd4bf', '#0284c7',
      '<path d="M12 46 Q32 10 52 46" stroke="url(#grad)" stroke-width="3.5" stroke-linecap="round" fill="none"/><line x1="22" y1="31" x2="22" y2="48" stroke="#64748b" stroke-width="2"/><line x1="32" y1="24" x2="32" y2="48" stroke="#64748b" stroke-width="2"/><line x1="42" y1="31" x2="42" y2="48" stroke="#64748b" stroke-width="2"/><rect x="25" y="15" width="14" height="8" rx="3" fill="#fbbf24" stroke="#fef3c7" stroke-width="1.5"/>'
    ],
    obsidian_cat: [
      '#fbbf24', '#a855f7', '#1e1b24',
      '<polygon points="18,28 18,14 27,22 37,22 46,14 46,28 43,45 21,45" fill="url(#grad)" stroke="#fbbf24" stroke-width="2" stroke-linejoin="round"/><polygon points="23,31 29,31 26,35" fill="#fde047"/><polygon points="35,31 41,31 38,35" fill="#fde047"/><polygon points="30,38 34,38 32,41" fill="#f43f5e"/>'
    ],
    jalapeno_overdrive: [
      '#fb7185', '#f43f5e', '#f97316',
      '<circle cx="32" cy="32" r="17" fill="url(#grad)" stroke="#fde047" stroke-width="2"/><circle cx="26" cy="26" r="3" fill="#7f1d1d"/><circle cx="38" cy="28" r="2.5" fill="#7f1d1d"/><circle cx="30" cy="38" r="3" fill="#7f1d1d"/><path d="M38 36 C42 36, 44 41, 39 44" stroke="#4ade80" stroke-width="3" stroke-linecap="round" fill="none"/>'
    ],
    sacred_heart_prism: [
      '#fde047', '#f43f5e', '#f59e0b',
      '<path d="M32 49 C32 49, 14 37, 14 24 C14 17, 20 14, 26 16 C29 17, 31 20, 32 22 C33 20, 35 17, 38 16 C44 14, 50 17, 50 24 C50 37, 32 49, 32 49 Z" fill="url(#grad)" stroke="#fef08a" stroke-width="2" stroke-linejoin="round"/><polygon points="32,23 39,32 32,41 25,32" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>'
    ]
  },

  bosses: {
    sentinel: [
      '#f59e0b', '#fbbf24', '#b45309',
      '<path d="M18 16 H46 V32 C46 43, 32 50, 32 50 C32 50, 18 43, 18 32 Z" fill="url(#grad)" stroke="#fef3c7" stroke-width="2.2" stroke-linejoin="round"/><line x1="32" y1="16" x2="32" y2="49" stroke="#78350f" stroke-width="2"/><polygon points="32,24 37,31 32,38 27,31" fill="#2dd4bf" stroke="#ccfbf1" stroke-width="1.2"/>'
    ],
    spore_queen: [
      '#a3e635', '#84cc16', '#15803d',
      '<path d="M14 34 C14 19, 50 19, 50 34 Z" fill="url(#grad)" stroke="#ecfccb" stroke-width="2"/><polygon points="22,22 26,13 32,20 38,13 42,22" fill="#fbbf24" stroke="#fef08a" stroke-width="1.5" stroke-linejoin="round"/><path d="M25 34 V47 H39 V34" fill="#365314" stroke="#a3e635" stroke-width="1.8"/><circle cx="29" cy="40" r="2" fill="#fde047"/><circle cx="35" cy="40" r="2" fill="#fde047"/>'
    ],
    chronos_dali: [
      '#fde047', '#38bdf8', '#a855f7',
      '<polygon points="20,14 44,14 35,31 44,48 20,48 29,31" fill="url(#grad)" stroke="#fef08a" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="31" r="4" fill="#fbbf24"/>'
    ],
    petrifier_archon: [
      '#f43f5e', '#a8a29e', '#44403c',
      '<polygon points="22,14 42,14 46,48 18,48" fill="url(#grad)" stroke="#e7e5e4" stroke-width="2" stroke-linejoin="round"/><polygon points="23,27 30,29 24,33" fill="#f43f5e"/><polygon points="41,27 34,29 40,33" fill="#f43f5e"/><line x1="26" y1="41" x2="38" y2="41" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>'
    ],
    mirror_virtuoso: [
      '#e879f9', '#2dd4bf', '#f59e0b',
      '<path d="M32 14 C21 14, 16 23, 18 35 C20 44, 27 49, 32 49 V14 Z" fill="#fbbf24" stroke="#fef3c7" stroke-width="1.8"/><path d="M32 14 C43 14, 48 23, 46 35 C44 44, 37 49, 32 49 V14 Z" fill="#14b8a6" stroke="#ccfbf1" stroke-width="1.8"/><circle cx="25" cy="28" r="2.5" fill="#0f172a"/><circle cx="39" cy="28" r="2.5" fill="#0f172a"/>'
    ],
    magma_leviathan: [
      '#fde047', '#f97316', '#991b1b',
      '<polygon points="14,38 18,18 28,25 32,15 36,25 46,18 50,38 32,50" fill="url(#grad)" stroke="#fde047" stroke-width="2" stroke-linejoin="round"/><polygon points="23,33 29,35 25,38" fill="#fef08a"/><polygon points="41,33 35,35 39,38" fill="#fef08a"/>'
    ],
    tectonic_behemoth: [
      '#f59e0b', '#d97706', '#44403c',
      '<polygon points="12,30 22,14 42,14 52,30 44,49 20,49" fill="url(#grad)" stroke="#fed7aa" stroke-width="2" stroke-linejoin="round"/><polyline points="22,14 30,28 24,39 32,49" stroke="#fde047" stroke-width="2.2" fill="none"/><circle cx="24" cy="27" r="2.5" fill="#ef4444"/><circle cx="40" cy="27" r="2.5" fill="#ef4444"/>'
    ]
  },

  topologies: {
    classic_grid: [
      '#f59e0b', '#fbbf24', '#b45309',
      '<rect x="14" y="16" width="36" height="32" rx="4" fill="#1c1917" stroke="url(#grad)" stroke-width="2.2"/><circle cx="23" cy="25" r="3" fill="#fbbf24"/><circle cx="32" cy="25" r="3" fill="#2dd4bf"/><circle cx="41" cy="25" r="3" fill="#fbbf24"/><circle cx="23" cy="37" r="3" fill="#2dd4bf"/><circle cx="32" cy="37" r="3" fill="#fbbf24"/><circle cx="41" cy="37" r="3" fill="#2dd4bf"/>'
    ],
    step_ziggurat: [
      '#fbbf24', '#f59e0b', '#92400e',
      '<polygon points="12,46 12,36 20,36 20,26 27,26 27,17 37,17 37,26 44,26 44,36 52,36 52,46" fill="url(#grad)" stroke="#fef3c7" stroke-width="2" stroke-linejoin="round"/>'
    ],
    twin_spires: [
      '#2dd4bf', '#38bdf8', '#0369a1',
      '<polygon points="14,48 14,16 26,16 26,34 38,34 38,16 50,16 50,48" fill="url(#grad)" stroke="#e0f2fe" stroke-width="2" stroke-linejoin="round"/>'
    ],
    stalactite_arch: [
      '#c084fc', '#a855f7', '#4c1d95',
      '<polygon points="14,16 50,16 50,48 40,48 40,29 32,37 24,29 24,48 14,48" fill="url(#grad)" stroke="#f3e8ff" stroke-width="2" stroke-linejoin="round"/>'
    ],
    surrealist_chalice: [
      '#fde047', '#eab308', '#a16207',
      '<polygon points="16,16 48,16 38,31 46,48 18,48 26,31" fill="url(#grad)" stroke="#fef9c3" stroke-width="2" stroke-linejoin="round"/>'
    ],
    sunken_caldera: [
      '#fb923c', '#f97316', '#991b1b',
      '<polygon points="12,46 18,20 27,32 37,32 46,20 52,46" fill="url(#grad)" stroke="#fed7aa" stroke-width="2" stroke-linejoin="round"/><path d="M26 32 Q32 41 38 32" fill="#fde047"/>'
    ],
    obsidian_citadel: [
      '#cbd5e1', '#94a3b8', '#334155',
      '<polygon points="14,48 14,18 21,18 21,26 28,26 28,18 36,18 36,26 43,26 43,18 50,18 50,48" fill="url(#grad)" stroke="#f8fafc" stroke-width="2" stroke-linejoin="round"/>'
    ]
  },

  slots: {
    gilded: [
      '#fde047', '#facc15', '#ca8a04',
      '<circle cx="32" cy="32" r="16" stroke="url(#grad)" stroke-width="5" fill="none"/><polygon points="32,21 39,32 32,43 25,32" fill="#fde047"/>'
    ],
    spice: [
      '#fb7185', '#f43f5e', '#dc2626',
      '<circle cx="32" cy="32" r="16" stroke="url(#grad)" stroke-width="5" fill="none"/><path d="M32 20 C37 26, 39 32, 32 42 C25 32, 27 26, 32 20 Z" fill="#fde047"/>'
    ],
    web: [
      '#c084fc', '#a855f7', '#6b21a8',
      '<circle cx="32" cy="32" r="16" stroke="url(#grad)" stroke-width="4" fill="none"/><line x1="16" y1="32" x2="48" y2="32" stroke="#e9d5ff" stroke-width="1.6"/><line x1="32" y1="16" x2="32" y2="48" stroke="#e9d5ff" stroke-width="1.6"/><line x1="21" y1="21" x2="43" y2="43" stroke="#e9d5ff" stroke-width="1.6"/><line x1="43" y1="21" x2="21" y2="43" stroke="#e9d5ff" stroke-width="1.6"/><circle cx="32" cy="32" r="7" stroke="#e9d5ff" stroke-width="1.5" fill="none"/>'
    ],
    amplifier: [
      '#7dd3fc', '#38bdf8', '#0284c7',
      '<circle cx="32" cy="32" r="16" stroke="url(#grad)" stroke-width="5" fill="none"/><polygon points="32,19 43,32 32,45 21,32" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.5"/>'
    ],
    cursed_spore: [
      '#a3e635', '#84cc16', '#3f6212',
      '<circle cx="32" cy="32" r="15" stroke="url(#grad)" stroke-width="4.5" stroke-dasharray="6 3" fill="none"/><circle cx="27" cy="29" r="3" fill="#a3e635"/><circle cx="37" cy="29" r="3" fill="#a3e635"/><circle cx="32" cy="37" r="3" fill="#fde047"/>'
    ]
  },

  wheel: {
    jackpot_hoard: [
      '#fbbf24', '#fde047', '#d97706',
      '<polygon points="14,44 18,22 27,30 32,16 37,30 46,22 50,44" fill="url(#grad)" stroke="#fef9c3" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="36" r="3.5" fill="#e879f9"/>'
    ],
    pickpocket_gremlin: [
      '#f43f5e', '#fb7185', '#881337',
      '<polygon points="12,24 22,26 28,18 36,18 42,26 52,24 44,44 20,44" fill="url(#grad)" stroke="#fecdd3" stroke-width="1.8" stroke-linejoin="round"/><circle cx="27" cy="31" r="2.5" fill="#fde047"/><circle cx="37" cy="31" r="2.5" fill="#fde047"/>'
    ],
    relic_vault: [
      '#5eead4', '#2dd4bf', '#0f766e',
      '<path d="M24 14 H40 L37 22 L44 32 L40 48 H24 L20 32 L27 22 Z" fill="url(#grad)" stroke="#ccfbf1" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="34" r="4" fill="#fde047"/>'
    ],
    cave_in_hazard: [
      '#ef4444', '#f87171', '#7f1d1d',
      '<polygon points="18,46 16,32 28,24 42,28 46,42 32,49" fill="url(#grad)" stroke="#fecaca" stroke-width="2"/><path d="M36 12 L48 22 M42 10 L52 18" stroke="#fde047" stroke-width="2.5" stroke-linecap="round"/>'
    ],
    arcane_surge: [
      '#6ee7b7', '#34d399', '#047857',
      '<polygon points="35,12 18,34 31,34 27,52 46,28 33,28" fill="url(#grad)" stroke="#ecfdf5" stroke-width="2" stroke-linejoin="round"/>'
    ],
    hex_of_abyss: [
      '#a855f7', '#c084fc', '#4c1d95',
      '<path d="M20 28 C20 16, 44 16, 44 28 C44 35, 40 38, 40 46 H24 C24 38, 20 35, 20 28 Z" fill="url(#grad)" stroke="#f3e8ff" stroke-width="2"/><circle cx="27" cy="29" r="3" fill="#09070d"/><circle cx="37" cy="29" r="3" fill="#09070d"/>'
    ],
    gilded_blessing: [
      '#fde047', '#fcd34d', '#b45309',
      '<circle cx="25" cy="26" r="7" stroke="#fde047" stroke-width="3" fill="none"/><circle cx="39" cy="26" r="7" stroke="#fde047" stroke-width="3" fill="none"/><circle cx="32" cy="39" r="7" stroke="#fde047" stroke-width="3" fill="none"/>'
    ],
    ai_headstart: [
      '#fdba74', '#fb923c', '#7c2d12',
      '<rect x="18" y="20" width="28" height="24" rx="5" fill="url(#grad)" stroke="#ffedd5" stroke-width="2"/><line x1="32" y1="12" x2="32" y2="20" stroke="#2dd4bf" stroke-width="2.5"/><circle cx="26" cy="30" r="3" fill="#2dd4bf"/><circle cx="38" cy="30" r="3" fill="#2dd4bf"/><line x1="24" y1="38" x2="40" y2="38" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>'
    ],
    tectonic_reinforce: [
      '#93c5fd', '#60a5fa', '#1d4ed8',
      '<path d="M18 16 H46 V33 C46 43, 32 50, 32 50 C32 50, 18 43, 18 33 Z" fill="url(#grad)" stroke="#dbeafe" stroke-width="2"/><path d="M32 22 V42 M22 32 H42" stroke="#fef08a" stroke-width="3.5" stroke-linecap="round"/>'
    ]
  },

  hud: {
    coin: [
      '#fbbf24', '#fde047', '#ca8a04',
      '<circle cx="32" cy="32" r="18" fill="url(#grad)" stroke="#fef9c3" stroke-width="2.2"/><polygon points="32,20 39,32 32,44 25,32" fill="#78350f" stroke="#fef08a" stroke-width="1.5"/>'
    ],
    stability: [
      '#f97316', '#fb923c', '#b91c1c',
      '<polygon points="12,48 24,22 40,22 52,48" fill="url(#grad)" stroke="#fed7aa" stroke-width="2" stroke-linejoin="round"/><path d="M27 22 Q32 34 37 22" fill="#fde047"/><path d="M26 14 L22 9 M32 13 V7 M38 14 L42 9" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>'
    ],
    mana: [
      '#2dd4bf', '#38bdf8', '#fbbf24',
      '<polygon points="32,10 46,26 40,50 24,50 18,26" fill="url(#grad)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><polyline points="32,10 32,50" stroke="#ffffff" stroke-width="1.4" stroke-opacity="0.6"/>'
    ],
    trophy: [
      '#fbbf24', '#fde047', '#b45309',
      '<path d="M20 16 H44 V28 C44 36, 37 40, 32 40 C27 40, 20 36, 20 28 Z" fill="url(#grad)" stroke="#fef9c3" stroke-width="2"/><path d="M32 40 V48 M22 48 H42" stroke="#fde047" stroke-width="3" stroke-linecap="round"/>'
    ],
    skull: [
      '#fb7185', '#f43f5e', '#881337',
      '<path d="M18 28 C18 15, 46 15, 46 28 C46 35, 41 38, 41 46 H23 C23 38, 18 35, 18 28 Z" fill="url(#grad)" stroke="#ffe4e6" stroke-width="2"/><circle cx="26" cy="29" r="3.5" fill="#09070d"/><circle cx="38" cy="29" r="3.5" fill="#09070d"/>'
    ],
    heart_full: [
      '#fda4af', '#f43f5e', '#be123c',
      '<path d="M32 48 C32 48, 14 36, 14 23 C14 16, 20 13, 26 15 C29 16, 31 19, 32 21 C33 19, 35 16, 38 15 C44 13, 50 16, 50 23 C50 36, 32 48, 32 48 Z" fill="url(#grad)" stroke="#ffe4e6" stroke-width="2" stroke-linejoin="round"/>'
    ],
    heart_empty: [
      '#64748b', '#475569', '#1e293b',
      '<path d="M32 48 C32 48, 14 36, 14 23 C14 16, 20 13, 26 15 C29 16, 31 19, 32 21 C33 19, 35 16, 38 15 C44 13, 50 16, 50 23 C50 36, 32 48, 32 48 Z" fill="url(#grad)" stroke="#94a3b8" stroke-width="2" stroke-linejoin="round"/><polyline points="29,19 34,28 28,35 33,44" stroke="#0f172a" stroke-width="2.2" fill="none"/>'
    ],
    wheel: [
      '#fde047', '#fbbf24', '#e11d48',
      '<circle cx="32" cy="32" r="18" fill="url(#grad)" stroke="#fef08a" stroke-width="2.2"/><circle cx="32" cy="32" r="5" fill="#1c1917" stroke="#fde047" stroke-width="2"/><path d="M32 14 V27 M32 37 V50 M14 32 H27 M37 32 H50" stroke="#fef08a" stroke-width="1.8"/>'
    ],
    chest: [
      '#fde047', '#f59e0b', '#991b1b',
      '<rect x="14" y="22" width="36" height="24" rx="4" fill="url(#grad)" stroke="#fef3c7" stroke-width="2"/><line x1="14" y1="31" x2="50" y2="31" stroke="#fef08a" stroke-width="2.5"/><rect x="29" y="28" width="6" height="7" rx="1.5" fill="#fde047"/>'
    ],
    reroll: [
      '#5eead4', '#2dd4bf', '#0f766e',
      '<rect x="16" y="16" width="32" height="32" rx="6" fill="url(#grad)" stroke="#ccfbf1" stroke-width="2"/><circle cx="24" cy="24" r="2.8" fill="#0f172a"/><circle cx="32" cy="32" r="2.8" fill="#0f172a"/><circle cx="40" cy="40" r="2.8" fill="#0f172a"/><circle cx="40" cy="24" r="2.8" fill="#0f172a"/><circle cx="24" cy="40" r="2.8" fill="#0f172a"/>'
    ],
    lock: [
      '#94a3b8', '#64748b', '#334155',
      '<rect x="18" y="28" width="28" height="20" rx="4" fill="url(#grad)" stroke="#cbd5e1" stroke-width="2"/><path d="M24 28 V21 C24 15, 40 15, 40 21 V28" stroke="#cbd5e1" stroke-width="2.5" fill="none"/><circle cx="32" cy="38" r="2.5" fill="#fbbf24"/>'
    ],
    warning: [
      '#fbbf24', '#f43f5e', '#b45309',
      '<polygon points="32,12 52,48 12,48" fill="url(#grad)" stroke="#fef08a" stroke-width="2" stroke-linejoin="round"/><line x1="32" y1="24" x2="32" y2="36" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="42" r="2" fill="#ffffff"/>'
    ]
  }
};

// Shared Subterranean Carved Obsidian Medallion SVG Builder
function buildMedallionSvgUri(category, id, spec) {
  const [rim, g0, g1, bodyMarkup] = spec;
  const uid = `${category}-${id}`;
  const body = bodyMarkup.replace(/url\(#grad\)/g, `url(#grad-${uid})`);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">` +
      `<defs>` +
        `<radialGradient id="bg-${uid}" cx="50%" cy="38%" r="65%">` +
          `<stop offset="0%" stop-color="#231c2e"/>` +
          `<stop offset="70%" stop-color="#110e17"/>` +
          `<stop offset="100%" stop-color="#070609"/>` +
        `</radialGradient>` +
        `<linearGradient id="grad-${uid}" x1="0%" y1="0%" x2="100%" y2="100%">` +
          `<stop offset="0%" stop-color="${g0}"/>` +
          `<stop offset="100%" stop-color="${g1}"/>` +
        `</linearGradient>` +
        `<filter id="glow-${uid}" x="-20%" y="-20%" width="140%" height="140%">` +
          `<feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>` +
          `<feOffset in="blur" dx="0" dy="1.5" result="offsetBlur"/>` +
          `<feFlood flood-color="${g0}" flood-opacity="0.45" result="offsetColor"/>` +
          `<feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetGlow"/>` +
          `<feMerge>` +
            `<feMergeNode in="offsetGlow"/>` +
            `<feMergeNode in="SourceGraphic"/>` +
          `</feMerge>` +
        `</filter>` +
      `</defs>` +
      `<rect x="4" y="4" width="56" height="56" rx="14" fill="url(#bg-${uid})" stroke="${rim}" stroke-width="2.2"/>` +
      `<rect x="7.5" y="7.5" width="49" height="49" rx="10.5" stroke="${g0}" stroke-opacity="0.22" stroke-width="1"/>` +
      `<circle cx="11" cy="11" r="1.3" fill="${rim}" opacity="0.7"/>` +
      `<circle cx="53" cy="11" r="1.3" fill="${rim}" opacity="0.7"/>` +
      `<circle cx="11" cy="53" r="1.3" fill="${rim}" opacity="0.7"/>` +
      `<circle cx="53" cy="53" r="1.3" fill="${rim}" opacity="0.7"/>` +
      `<g filter="url(#glow-${uid})">${body}</g>` +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Populate C4_ICON_MANIFEST & C4_INLINE_SVG_URIS from the compact spec registry
const C4_ICON_MANIFEST = {};
const C4_INLINE_SVG_URIS = {};

for (const [category, items] of Object.entries(C4_MEDALLION_SPECS)) {
  C4_ICON_MANIFEST[category] = {};
  C4_INLINE_SVG_URIS[category] = {};
  for (const [id, spec] of Object.entries(items)) {
    C4_ICON_MANIFEST[category][id] = `./assets/icons/${category}/${id}.svg`;
    C4_INLINE_SVG_URIS[category][id] = buildMedallionSvgUri(category, id, spec);
  }
}

const C4_ROULETTE_IMAGE_CACHE = new Map();

function getC4IconUrl(category, id, preferInlineDataUri = true) {
  if (preferInlineDataUri && C4_INLINE_SVG_URIS[category] && C4_INLINE_SVG_URIS[category][id]) {
    return C4_INLINE_SVG_URIS[category][id];
  }
  if (C4_ICON_MANIFEST[category] && C4_ICON_MANIFEST[category][id]) {
    return C4_ICON_MANIFEST[category][id];
  }
  return C4_INLINE_SVG_URIS.hud.coin;
}

function renderC4IconHTML(category, id, sizeClass = '', altText = '') {
  const url = getC4IconUrl(category, id);
  // Strip any HTML tags or quotes from altText so nested <img> tags can never corrupt attributes
  const safeAlt = String(altText || id || 'icon')
    .replace(/<[^>]*>/g, '')
    .replace(/"/g, '&quot;')
    .trim();
  const cls = ['c4-item-icon', sizeClass].filter(Boolean).join(' ');
  return `<img src="${url}" alt="${safeAlt}" class="${cls}" loading="eager" decoding="async" />`;
}

function preloadRouletteWheelIcons() {
  if (!C4_ICON_MANIFEST.wheel) return;
  Object.keys(C4_ICON_MANIFEST.wheel).forEach((wedgeId) => {
    if (C4_ROULETTE_IMAGE_CACHE.has(wedgeId)) return;
    const img = new Image();
    img.src = getC4IconUrl('wheel', wedgeId, true);
    C4_ROULETTE_IMAGE_CACHE.set(wedgeId, img);
  });
}

function patchRouletteInstanceOrPrototype() {
  const targetProto = (typeof SubterraneanRouletteSimulator !== 'undefined' && SubterraneanRouletteSimulator.prototype)
    ? SubterraneanRouletteSimulator.prototype
    : (typeof rouletteSim !== 'undefined' && rouletteSim ? Object.getPrototypeOf(rouletteSim) : null);

  if (targetProto && !targetProto._c4WheelPatched) {
    targetProto._c4WheelPatched = true;
    const _origRender = targetProto.render;
    targetProto.render = function () {
      // 1. Temporarily blank out wedge.icon so _origRender's ctx.fillText(wedge.icon, 0, -3)
      // does NOT print raw <img src="data:image/svg+xml..."> HTML across the wheel
      const savedIcons = this.wedges.map((w) => w.icon);
      for (let i = 0; i < this.wedges.length; i++) {
        this.wedges[i].icon = '';
      }

      _origRender.call(this);

      // Restore HTML <img> icons for DOM badges, toasts & legend pills
      for (let i = 0; i < this.wedges.length; i++) {
        this.wedges[i].icon = savedIcons[i];
      }

      // 2. Draw preloaded SVG medallion images cleanly inside each spinning wedge pocket
      const ctx = this.ctx;
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.wheelAngle);
      for (let i = 0; i < this.numWedges; i++) {
        const wedge = this.wedges[i];
        let img = C4_ROULETTE_IMAGE_CACHE.get(wedge.id);
        if (!img) {
          img = new Image();
          img.src = getC4IconUrl('wheel', wedge.id, true);
          C4_ROULETTE_IMAGE_CACHE.set(wedge.id, img);
        }
        const mid = (i + 0.5) * this.arc;
        ctx.save();
        ctx.translate(Math.cos(mid) * 62, Math.sin(mid) * 62);
        ctx.rotate(mid + Math.PI / 2);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -12, -13, 24, 24);
        } else if (wedge.rawEmoji) {
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(wedge.rawEmoji, 0, -3);
        }
        ctx.restore();
      }
      ctx.restore();
    };
  }

  if (typeof rouletteSim !== 'undefined' && rouletteSim && typeof rouletteSim.populateLegend === 'function') {
    rouletteSim.populateLegend();
  }
}

function patchCatalogCollection(collection, category, sizeClass = '') {
  if (!collection) return;
  const list = Array.isArray(collection) ? collection : Object.values(collection);
  list.forEach((item) => {
    if (!item || !item.id) return;
    if (!item.rawEmoji && typeof item.icon === 'string' && !item.icon.includes('<img')) {
      item.rawEmoji = item.icon;
    }
    item.iconUrl = getC4IconUrl(category, item.id);
    item.icon = renderC4IconHTML(category, item.id, sizeClass, item.name);
  });
}

function patchGameCatalogsWithSVGIcons() {
  preloadRouletteWheelIcons();

  // 1–6. Hydrate all game catalogs with inline SVG Medallions
  if (typeof CARD_CATALOG !== 'undefined') patchCatalogCollection(CARD_CATALOG, 'cards');
  if (typeof RESERVE_CATALOG !== 'undefined') patchCatalogCollection(RESERVE_CATALOG, 'reserves');
  if (typeof GAMBIT_CATALOG !== 'undefined') patchCatalogCollection(GAMBIT_CATALOG, 'gambits');
  if (typeof BOARD_TOPOLOGIES !== 'undefined') patchCatalogCollection(BOARD_TOPOLOGIES, 'topologies', 'c4-item-icon-sm');
  if (typeof BOSS_ARCHETYPES !== 'undefined') patchCatalogCollection(BOSS_ARCHETYPES, 'bosses');
  if (typeof ROULETTE_WEDGES !== 'undefined') patchCatalogCollection(ROULETTE_WEDGES, 'wheel');

  // 7. Upgrade Inspector, HUD & Modal Icon Containers
  const iconElementIds = [
    'inspector-icon',
    'sheet-icon',
    'sheet-title',
    'floor-intro-icon-wrap',
    'floor-intro-boss-name',
    'floor-intro-topo-name',
    'boss-name-label',
    'topology-badge',
    'roulette-center-icon',
    'gameover-emoji',
    'tutorial-step-icon'
  ];

  // Elements where only plain text should be shown (since #floor-intro-icon-wrap above it already renders the Boss medallion)
  const stripImgElementIds = new Set([
    'floor-intro-boss-name'
  ]);

  iconElementIds.forEach((elId) => {
    const el = document.getElementById(elId);
    if (!el || el._c4IconPatched) return;
    el._c4IconPatched = true;
    Object.defineProperty(el, 'textContent', {
      get() {
        return this.innerHTML;
      },
      set(val) {
        const strVal = String(val ?? '');
        if (stripImgElementIds.has(elId)) {
          const cleanText = strVal.replace(/<img[^>]*>/gi, '').trim();
          this.innerHTML = '';
          this.appendChild(document.createTextNode(cleanText));
        } else if (strVal.includes('<img')) {
          this.innerHTML = strVal;
        } else {
          this.innerHTML = '';
          this.appendChild(document.createTextNode(strVal));
        }
      }
    });
  });

  // 8. Patch Roulette Wheel 2D Canvas Renderer
  patchRouletteInstanceOrPrototype();
  window.addEventListener('DOMContentLoaded', patchRouletteInstanceOrPrototype, { once: true });
  window.addEventListener('load', patchRouletteInstanceOrPrototype, { once: true });
}

if (typeof window !== 'undefined') {
  window.C4_ICONS = {
    specs: C4_MEDALLION_SPECS,
    manifest: C4_ICON_MANIFEST,
    inlineUris: C4_INLINE_SVG_URIS,
    buildUri: buildMedallionSvgUri,
    getUrl: getC4IconUrl,
    renderHTML: renderC4IconHTML,
    patchAll: patchGameCatalogsWithSVGIcons,
    patchWheel: patchRouletteInstanceOrPrototype
  };

  patchGameCatalogsWithSVGIcons();
}
