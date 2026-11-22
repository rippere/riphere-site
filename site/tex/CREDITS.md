# Texture credits

Every map in this folder comes from [Poly Haven](https://polyhaven.com), downloaded directly from
`dl.polyhaven.org`. Poly Haven publishes all of its assets under **CC0 1.0 Universal (public domain
dedication)**: free for any use, commercial included, with no attribution required. The authors are
credited here anyway. License text: https://polyhaven.com/license

| Set (Poly Haven id) | Name on Poly Haven | Author(s) | License | Files here | Used for (scene3d.js) |
|---|---|---|---|---|---|
| `concrete_wall_006` | Concrete Wall 006 | Charlotte Baglioni (photography), Dario Barresi (processing) | CC0 1.0 | `_diff_2k`, `_nor_gl_2k`, `_arm_1k` | hero tower precast window units and base-band panels (`T_PCAST`) |
| `wood_textured_concrete` | Wood Textured Concrete | Dimitrios Savva | CC0 1.0 | `_diff_1k`, `_nor_gl_1k`, `_arm_1k` | board-formed column grid, transfer beam, cornice, penthouses, lobby pilotis (`T_BOARD`) |
| `brushed_concrete_04` | Brushed Concrete 04 | Amal Kumar | CC0 1.0 | `_diff_1k`, `_nor_gl_1k`, `_arm_1k` | bush-hammered spandrel ledges and coping, granite plinths (`T_BUSH`) |
| `concrete_slab_wall_02` | Concrete Slab Wall 02 | Amal Kumar | CC0 1.0 | `_diff_1k`, `_nor_1k`, `_rough_1k` | kerbs and the planter (`T_SLAB`) |
| `concrete` | Concrete | Rob Tuytel | CC0 1.0 | `_diff_1k`, `_nor_1k`, `_rough_1k` | lobby interior, canopy soffit, background city base colour (`T_PANEL`) |
| `concrete_tiles_02` | Concrete Tiles 02 | Charlotte Baglioni | CC0 1.0 | `_diff_1k`, `_nor_1k`, `_rough_1k` | sidewalks (`T_PAVE`) |
| `clean_asphalt` | Clean Asphalt | Dimitrios Savva | CC0 1.0 | `_diff_1k`, `_nor_1k`, `_rough_1k` | wet street and avenue (`T_ASPH`) |

`_arm` maps are Poly Haven's packed AO / roughness / metalness maps (R = ambient occlusion,
G = roughness, B = metalness); scene3d.js feeds the same texture to `aoMap` (reads R) and
`roughnessMap` (reads G). `_nor_gl` = OpenGL-convention normal maps (three.js convention).

Everything else in the scene (window interiors, stains and rain streaks, signs, sky, people) is drawn
procedurally in scene3d.js at runtime; no other image assets are used.

The maps here are byte-for-byte re-encodes of the downloads (`jpegtran -copy icc -optimize -progressive`, 2026-11-22):
lossless, so every decoded pixel and the ICC profile are unchanged; only Huffman tables, scan order and EXIF/IPTC went.
