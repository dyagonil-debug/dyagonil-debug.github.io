// ============================================================================
// PROCEDURAL BOARD TOPOLOGIES & MASK GENERATORS (js/config/topologies.js)
// ============================================================================

// Procedural Board Topologies for Pre-Boss Vanguard Floors (2, 5, 8) & Boss Floors (3, 6, 9)
const BOARD_TOPOLOGIES = [
    {
        id: 'step_ziggurat',
        name: 'Step Pyramid Ziggurat',
        icon: '🏛️',
        desc: 'Outer upper corners are carved away into a tiered pyramid (Cols 1 & 7 height 4, Cols 2 & 6 height 5).',
        buildMask: () => {
            const m = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
            const v = Math.random() < 0.5 ? 2 : 1;
            for (let r = ROWS - v; r < ROWS; r++) { m[r][0] = false; m[r][6] = false; }
            m[5][1] = false; m[5][5] = false;
            return m;
        }
    },
    {
        id: 'twin_spires',
        name: 'Subterranean Chasm',
        icon: '🌉',
        desc: 'The central spire is carved with a top chasm and a raised bedrock pedestal, splitting upper lines into twin wings.',
        buildMask: () => {
            const m = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
            m[5][3] = false;
            if (Math.random() < 0.65) m[4][3] = false;
            else m[0][3] = false;
            m[5][2] = false; m[5][4] = false;
            return m;
        }
    },
    {
        id: 'stalactite_arch',
        name: 'Hanging Stalactite Arch',
        icon: '🦇',
        desc: 'Internal bedrock pillars elevate Columns 2 & 6 at the base while hanging stalactites carve the upper corners.',
        buildMask: () => {
            const m = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
            m[5][0] = false; m[5][6] = false;
            m[0][1] = false; m[0][5] = false;
            if (Math.random() < 0.5) m[0][3] = false;
            return m;
        }
    },
    {
        id: 'surrealist_chalice',
        name: 'Surrealist Hourglass Chalice',
        icon: '🏆',
        desc: 'Lower outer corners are carved into elevated obsidian shelves so Columns 1 & 7 start 2 rows higher!',
        buildMask: () => {
            const m = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
            m[0][0] = false; m[1][0] = false;
            m[0][6] = false; m[1][6] = false;
            m[0][1] = false; m[0][5] = false;
            return m;
        }
    },
    {
        id: 'sunken_caldera',
        name: 'Sunken Caldera Crater',
        icon: '🌋',
        desc: 'A deep central magma basin flanked by elevated outer rims and tapered volcanic ridges.',
        buildMask: () => {
            const m = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
            m[0][0] = false; m[0][6] = false;
            m[5][0] = false; m[5][6] = false;
            m[5][3] = false;
            if (Math.random() < 0.5) { m[5][2] = false; m[5][4] = false; }
            return m;
        }
    },
    {
        id: 'obsidian_citadel',
        name: 'Obsidian Battlements',
        icon: '🏰',
        desc: ' alternating crenelations along the top canopy and raised center bedrock create tactical diagonal corridors.',
        buildMask: () => {
            const m = Array.from({ length: ROWS }, () => Array(COLS).fill(true));
            m[5][1] = false; m[5][3] = false; m[5][5] = false;
            m[0][2] = false; m[0][4] = false;
            return m;
        }
    }
];

function getFloorTopology(floorIdx) {
    // Floors 1, 4, 7 (idx 0, 3, 6) use the Classic 7x6 Grid
    if (!isBossFloorIndex(floorIdx) && !isPreBossFloorIndex(floorIdx)) {
        return {
            id: 'classic_grid',
            name: 'Classic 7x6 Cavern Grid',
            icon: '📐',
            desc: 'Standard 42-slot subterranean Connect 4 frame with 0 void cells.',
            isProcedural: false,
            mask: Array.from({ length: ROWS }, () => Array(COLS).fill(true))
        };
    }
    const pool = (state.shuffledTopologyPool && state.shuffledTopologyPool.length > 0)
        ? state.shuffledTopologyPool
        : BOARD_TOPOLOGIES;
    const pick = pool[floorIdx % pool.length];
    const mask = pick.buildMask();
    return {
        id: pick.id,
        name: pick.name,
        icon: pick.icon,
        desc: pick.desc,
        isProcedural: true,
        mask
    };
}
