// ============================================================================
// PROCEDURAL BOARD TOPOLOGIES & MASK GENERATORS (js/config/topologies.js)
//   • 12 Symmetrical Procedural Cavern Topologies (Doubled from 6)
//   • 2 Asymmetrical Procedural Cavern Topologies
//   • 14 Total Warped Topologies for Vanguard (2, 5, 8, 11, 14) & Boss Floors (3, 6, 9, 12, 15)
// ============================================================================

const BOARD_TOPOLOGIES = [
  // --------------------------------------------------------------------------
  // ORIGINAL 6 SYMMETRICAL PROCEDURAL LAYOUTS
  // --------------------------------------------------------------------------
  {
    id: 'step_ziggurat',
    name: 'Step Pyramid Ziggurat',
    icon: '🏛️',
    isAsymmetrical: false,
    desc: 'Outer upper corners are carved away into a tiered pyramid (Cols 1 & 7 height 4–5, Cols 2 & 6 height 5).',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      const v = Math.random() < 0.5 ? 2 : 1;
      for (let r = ROWS - v; r < ROWS; r++) {
        m[r][0] = false;
        m[r][6] = false;
      }
      m[5][1] = false;
      m[5][5] = false;
      return m;
    }
  },
  {
    id: 'twin_spires',
    name: 'Subterranean Chasm',
    icon: '🌉',
    isAsymmetrical: false,
    desc: 'The central spire is carved with a top chasm and a raised bedrock pedestal, splitting upper lines into twin wings.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[5][3] = false;
      if (Math.random() < 0.65) m[4][3] = false;
      else m[0][3] = false;
      m[5][2] = false;
      m[5][4] = false;
      return m;
    }
  },
  {
    id: 'stalactite_arch',
    name: 'Hanging Stalactite Arch',
    icon: '🦇',
    isAsymmetrical: false,
    desc: 'Internal bedrock pillars elevate Columns 2 & 6 at the base while hanging stalactites carve the upper corners.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[5][0] = false;
      m[5][6] = false;
      m[0][1] = false;
      m[0][5] = false;
      if (Math.random() < 0.5) m[0][3] = false;
      return m;
    }
  },
  {
    id: 'surrealist_chalice',
    name: 'Surrealist Hourglass Chalice',
    icon: '🏆',
    isAsymmetrical: false,
    desc: 'Lower outer corners are carved into elevated obsidian shelves so Columns 1 & 7 start 2 rows higher!',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[0][0] = false;
      m[1][0] = false;
      m[0][6] = false;
      m[1][6] = false;
      m[0][1] = false;
      m[0][5] = false;
      return m;
    }
  },
  {
    id: 'sunken_caldera',
    name: 'Sunken Caldera Crater',
    icon: '🌋',
    isAsymmetrical: false,
    desc: 'A deep central magma basin flanked by elevated outer rims and tapered volcanic ridges.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[0][0] = false;
      m[0][6] = false;
      m[5][0] = false;
      m[5][6] = false;
      m[5][3] = false;
      if (Math.random() < 0.5) {
        m[5][2] = false;
        m[5][4] = false;
      }
      return m;
    }
  },
  {
    id: 'obsidian_citadel',
    name: 'Obsidian Battlements',
    icon: '🏰',
    isAsymmetrical: false,
    desc: 'Alternating crenelations along the top canopy and raised center bedrock create tactical diagonal corridors.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[5][1] = false;
      m[5][3] = false;
      m[5][5] = false;
      m[0][2] = false;
      m[0][4] = false;
      return m;
    }
  },

  // --------------------------------------------------------------------------
  // 6 NEW SYMMETRICAL PROCEDURAL LAYOUTS (DOUBLING PROCEDURAL POOL TO 12)
  // --------------------------------------------------------------------------
  {
    id: 'basalt_colonnade',
    name: 'Basalt Pillar Colonnade',
    icon: '⛩️',
    isAsymmetrical: false,
    desc: 'Raised bedrock pedestals elevate Columns 1, 4 & 7 at the base while twin upper arches carve Columns 3 & 5.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[0][0] = false;
      m[0][6] = false;
      m[0][3] = false;
      if (Math.random() < 0.5) {
        m[1][3] = false;
      }
      m[5][2] = false;
      m[5][4] = false;
      return m;
    }
  },
  {
    id: 'crystalline_gorge',
    name: 'Crystalline Gorge Basin',
    icon: '💎',
    isAsymmetrical: false,
    desc: 'Bedrock shelves lift Columns 3 & 5 around a deep central vein while hanging formations narrow the outer canopy.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[0][2] = false;
      m[0][4] = false;
      m[5][1] = false;
      m[5][5] = false;
      if (Math.random() < 0.5) {
        m[5][0] = false;
        m[5][6] = false;
      } else {
        m[0][0] = false;
        m[0][6] = false;
      }
      return m;
    }
  },
  {
    id: 'dwarven_anvil',
    name: 'Dwarven Forge Anvil',
    icon: '⚒️',
    isAsymmetrical: false,
    desc: 'Undercut bedrock waists beneath Columns 2 & 6 and tapered outer horns forge a heavy anvil-shaped arena.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[0][1] = false;
      m[0][5] = false;
      m[5][0] = false;
      m[5][6] = false;
      if (Math.random() < 0.5) {
        m[1][1] = false;
        m[1][5] = false;
      } else {
        m[0][2] = false;
        m[0][4] = false;
      }
      return m;
    }
  },
  {
    id: 'catacomb_nave',
    name: 'Vaulted Catacomb Nave',
    icon: '🕍',
    isAsymmetrical: false,
    desc: 'A soaring central spire flanked by vaulted upper arches in Columns 2 & 6 and raised reliquary pedestals.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[5][1] = false;
      m[5][5] = false;
      m[0][2] = false;
      m[0][4] = false;
      if (Math.random() < 0.5) {
        m[4][1] = false;
        m[4][5] = false;
      } else {
        m[0][0] = false;
        m[0][6] = false;
      }
      return m;
    }
  },
  {
    id: 'tectonic_mesa',
    name: 'Tectonic Mesa Plateau',
    icon: '🔱',
    isAsymmetrical: false,
    desc: 'A raised three-column central bedrock plateau elevates Columns 3, 4 & 5 above deep outer trenches.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[0][2] = false;
      m[0][3] = false;
      m[0][4] = false;
      m[5][0] = false;
      m[5][6] = false;
      if (Math.random() < 0.5) {
        m[1][3] = false;
      } else {
        m[5][1] = false;
        m[5][5] = false;
      }
      return m;
    }
  },
  {
    id: 'wyrm_fang_maw',
    name: 'Twin Fang Wyrm Maw',
    icon: '🐍',
    isAsymmetrical: false,
    desc: 'Twin ceiling fangs plunge two rows deep into Columns 2 & 6 while lower bedrock fangs rise beneath Columns 3 & 5.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      m[5][1] = false;
      m[4][1] = false;
      m[5][5] = false;
      m[4][5] = false;
      m[0][2] = false;
      m[0][4] = false;
      if (Math.random() < 0.5) {
        m[5][3] = false;
      } else {
        m[0][3] = false;
      }
      return m;
    }
  },

  // --------------------------------------------------------------------------
  // 2 NEW ASYMMETRICAL PROCEDURAL LAYOUTS
  // --------------------------------------------------------------------------
  {
    id: 'sheared_escarpment',
    name: 'Sheared Fault Escarpment',
    icon: '🪜',
    isAsymmetrical: true,
    desc: 'Asymmetrical tectonic shear: stepped bedrock cliffs elevate Columns 1–3 on the left while hanging ceiling shelves cap Columns 5–7 on the right.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      // Left side: stepped uplifted bedrock cliff
      m[0][0] = false;
      m[1][0] = false;
      m[0][1] = false;
      if (Math.random() < 0.5) {
        m[0][2] = false;
      } else {
        m[5][4] = false;
      }
      // Right side: overhanging sunken basin
      m[5][5] = false;
      m[5][6] = false;
      m[4][6] = false;
      return m;
    }
  },
  {
    id: 'cyclops_monolith',
    name: 'Asymmetric Monolith Buttress',
    icon: '🗿',
    isAsymmetrical: true,
    desc: 'Asymmetrical ruin: a 2-row bedrock monolith beneath Column 5 blocks lower-right horizontals while a carved western canopy opens upper-right lines.',
    buildMask: () => {
      const m = createGrid(ROWS, COLS, true);
      // Left side: carved western canopy above sunken amphitheater
      m[5][0] = false;
      m[4][0] = false;
      m[5][1] = false;
      if (Math.random() < 0.5) {
        m[5][2] = false;
      } else {
        m[0][5] = false;
      }
      // Right side: off-center 2-row monolith under Col 5 & eastern buttress under Col 7
      m[0][4] = false;
      m[1][4] = false;
      m[0][6] = false;
      return m;
    }
  }
];

function getFloorTopology(floorIdx) {
  // Floors 1, 4, 7, 10, 13 (idx 0, 3, 6, 9, 12) use the Classic 7x6 Grid
  if (!isBossFloorIndex(floorIdx) && !isPreBossFloorIndex(floorIdx)) {
    return {
      id: 'classic_grid',
      name: 'Classic 7x6 Cavern Grid',
      icon: '📐',
      desc: 'Standard 42-slot subterranean Connect 4 frame with 0 void cells.',
      loreDesc: 'An uncarved ancestral Connect 4 frame where every column stands open.',
      isProcedural: false,
      isAsymmetrical: false,
      mask: createGrid(ROWS, COLS, true)
    };
  }
  const pool = (state.shuffledTopologyPool && state.shuffledTopologyPool.length > 0)
    ? state.shuffledTopologyPool
    : BOARD_TOPOLOGIES;
  // Map procedural floors (1, 2, 4, 5, 7, 8, 10, 11, 13, 14) sequentially into the shuffled pool
  const proceduralSlotIdx = Math.max(0, floorIdx - 1 - Math.floor(floorIdx / 3));
  const pick = pool[proceduralSlotIdx % pool.length];
  return {
    id: pick.id,
    name: pick.name,
    icon: pick.icon,
    desc: pick.desc,
    loreDesc: pick.loreDesc || pick.desc,
    isProcedural: true,
    isAsymmetrical: !!pick.isAsymmetrical,
    mask: pick.buildMask()
  };
}

const TOPOLOGY_LORE_HINTS = {
  classic_grid: 'An uncarved ancestral Connect 4 frame where every column stands open.',
  step_ziggurat: 'A stepped ancient pyramid whose outer upper corners are carved away.',
  twin_spires: 'A split central chasm that divides the upper canopy into twin flanking towers.',
  stalactite_arch: 'Hanging ceiling stalactites and raised inner pillars warp the outer lanes.',
  surrealist_chalice: 'Elevated outer obsidian shelves lift the side columns above the basin.',
  sunken_caldera: 'A deep volcanic crater with raised outer rims and a hollowed upper crown.',
  obsidian_citadel: 'Fortress battlements along the canopy force diagonal skirmishes.',
  basalt_colonnade: 'Ancient basalt pillars lift the center and outer lanes above deep flanking trenches.',
  crystalline_gorge: 'A crystalline gorge where raised inner shoulders flank a deep central vein.',
  dwarven_anvil: 'Carved in the likeness of a titan’s anvil with undercut flanks and a broad upper face.',
  catacomb_nave: 'Ribbed subterranean vaults arch toward a towering central nave.',
  tectonic_mesa: 'A thrust-faulted central mesa rises between twin abyssal trenches.',
  wyrm_fang_maw: 'Jagged upper and lower stone fangs interlock like the jaws of a cavern wyrm.',
  sheared_escarpment: 'An asymmetrical fault line where the western floor juts upward and the eastern ceiling sags low.',
  cyclops_monolith: 'A lopsided cyclopean pillar props up the eastern vault while the western gallery sinks below.'
};
BOARD_TOPOLOGIES.forEach((t) => {
  if (TOPOLOGY_LORE_HINTS[t.id]) t.loreDesc = TOPOLOGY_LORE_HINTS[t.id];
});
