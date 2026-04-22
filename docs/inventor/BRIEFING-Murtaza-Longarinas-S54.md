# Briefing — Parametric Stringer Remodeling (CSN)

**To:** Murtaza (3D modeling, Nagpur)
**From:** Duarte Bustorff — CSN
**Date:** 2026-04-22 (Session S54)
**Priority:** High — blocks automated nesting export

---

## Context

CSN is building a Inventor parametric library for commercial vehicle bodywork.
Current Fiat L3 stringer files are **imported STEP geometry with no feature history**, which makes them
unusable for parametric workflows. This briefing describes the remodeling work needed.

Existing files (for reference only — **do not try to modify, they cannot be made parametric**):
- `Fiat L3 CCD_01_0101_01 - Chapa_Longarina_t=3mm_Rev07-Front-2.ipt`
- `Fiat L3 CCD_01_0101_01 - Chapa_Longarina_t=3mm_Rev07-Rear-2.ipt`

New files to create:
- `CSN_PAR_Stringer_Front_Xp.ipt`  (rear stringer, +X side, 12 teeth)
- `CSN_PAR_Stringer_Rear_Xn.ipt`   (front stringer, −X side, 8 teeth)
- `CSN_PAR_Bases.ipt`              (20 mounting bases, 12+X + 8−X)

---

## Coordinate system (mandatory)

- `X = 0` at rear axle of chassis
- `+X` toward cab
- `+Y` to the left (ISO 8855 standard)
- `Z = 0` at the bottom face of bodywork parts

Use short codes in naming: `Px`, `Nx`, `Py`, `Ny`.

---

## Task 1 — `CSN_PAR_Stringer_Front_Xp.ipt`

### Objective

Create a fully parametric stringer for the +X (rear) side of the chassis. It has **12 teeth** with
identical dimensions but independent X positions.

### User Parameters (exposed, Export flag = True)

| Parameter | Unit | Default value | Description |
|---|---|---|---|
| `SR_Length_Xp` | mm | 4000 | Total length of the stringer along X |
| `SR_Height` | mm | 80 | Section height |
| `SR_Thickness` | mm | 3 | Base plate thickness |
| `SR_Tooth_Width` | mm | 80 | Tooth width (shared across all 12) |
| `SR_Tooth_Height` | mm | 40 | Tooth height (shared) |
| `SR_Tooth_Hole_Dist` | mm | 131 | Hole-to-hole distance within the tooth |
| `SR_Tooth_Hole_Diam` | mm | 12.2 | Hole diameter |
| `SR_Tooth_1` | mm | 659.2 | X position of tooth 1 |
| `SR_Tooth_2` | mm | 1074.2 | X position of tooth 2 |
| `SR_Tooth_3` | mm | 1694.2 | X position of tooth 3 |
| `SR_Tooth_4` | mm | 1764.2 | X position of tooth 4 |
| `SR_Tooth_5` | mm | 2200 | (to be filled from chassis data) |
| … | … | … | … |
| `SR_Tooth_12` | mm | 3900 | X position of tooth 12 |

### Modeling method — use "Option 2" (single master sketch)

1. Create a master sketch on the top face of the stringer.
2. Place 12 construction points along the sketch.
3. Dimension each point X position to `SR_Tooth_1`, `SR_Tooth_2`, etc.
4. All 12 teeth share the same width/height/hole pattern — dimension them using shared parameters
   (`SR_Tooth_Width`, `SR_Tooth_Height`).
5. Use a **single Extrude feature** to create all 12 teeth.
6. Create a separate sketch for the slots between teeth, referencing the same 12 points.
7. Rename features in the browser:
   - `Sketch_Master_Teeth_Px`
   - `Feat_Teeth_Extrude`
   - `Feat_Rasgo_Xp_1` … `Feat_Rasgo_Xp_11`

### Validation

- Change `SR_Tooth_Width` from 80 to 100. All 12 teeth must widen together. ✓
- Change `SR_Tooth_3` from 1694.2 to 1700. Only tooth 3 moves. ✓
- Change `SR_Length_Xp`. Stringer body extends, teeth stay in place. ✓
- All features must rebuild without errors.

### iProperties (mandatory)

- `Material`: S235JR
- `Part Number`: CSN-PAR-STR-FR-XP
- `Description`: "Parametric Front Stringer +X (12 teeth)"

---

## Task 2 — `CSN_PAR_Stringer_Rear_Xn.ipt`

Same as Task 1 but for the −X (front) side, with **8 teeth**.

User parameters use prefix `T_Xn_` for positions:
- `T_Xn_1`, `T_Xn_2` … `T_Xn_8`

Reference values (Renault Master L3, first 2):
- `T_Xn_1` = 152.8 mm
- `T_Xn_2` = 985.8 mm

### iProperties

- `Material`: S235JR
- `Part Number`: CSN-PAR-STR-RR-XN
- `Description`: "Parametric Rear Stringer −X (8 teeth)"

---

## Task 3 — `CSN_PAR_Bases.ipt`

Single part file containing **20 mounting bases** as separate bodies:

- 12 bases on +X side (6 in +Y + 6 in −Y)
- 8 bases on −X side (4 in +Y + 4 in −Y)

Each base must be parametric and positioned using the same `SR_Tooth_N` and `T_Xn_N` parameters as the stringers.

### iProperties

- `Material`: S235JR
- `Part Number`: CSN-PAR-BASES-20
- `Description`: "20 Mounting Bases (12+X + 8−X)"

---

## Task 4 — Remodel 3 failing sheet metal parts

These parts exist but fail the Inventor Flat Pattern command (needed for DXF export to laser cutter):

1. `Universal_chassis_mounting_bodywork_80x4.ipt`  (12 instances in assembly)
2. `Fecho_07 - 02_Base.ipt`                        (2 instances)
3. `Fecho_01_01 Pega Fecho.ipt`                    (4 instances)

**Task:** remodel each one as proper **Inventor Sheet Metal** with:
- Sheet Metal Rules (S235JR, 3mm or as specified)
- Flat pattern generation
- Tested DXF export with layers properly mapped

---

## Task 5 — Fill material iProperty on 26 parts

The export rule found 26 `.ipt` files without Material iProperty. Please open each one and set:
- Material: S235JR (default for structural steel)
- Or S275JR / S355JR where applicable

A list of the 26 files will be sent separately as `26_parts_missing_material.txt`.

---

## Deliverables

1. 3 new `.ipt` files (Tasks 1, 2, 3)
2. 3 remodeled `.ipt` files (Task 4) as Sheet Metal with flat pattern working
3. 26 updated `.ipt` files with Material property set (Task 5)
4. Test assembly with the 3 new parametric parts positioned using Renault Master L3 reference values
5. Short video (5-10 min screen recording) showing parametric behavior: change 1 parameter, show all dependent features updating

---

## Definition of Done

- [ ] All parametric parts open without errors
- [ ] All 12 User Parameters of Stringer_Front_Xp change behavior as documented above
- [ ] Flat pattern generates correctly on the 3 remodeled sheet metal parts
- [ ] DXF export from flat pattern produces clean geometry (no stray lines, correct layers)
- [ ] All parts have Material, Part Number, Description iProperties filled
- [ ] Test assembly rebuilds with no errors

---

## Communication

- For any ambiguity on parameter values: **do not invent** — ask Duarte for the exact number from the chassis Body Builder Guidelines.
- For technical iLogic questions: reference files in `docs/inventor/` folder of the CSN repo.
- Deliver work in a single ZIP named `CSN_Parametric_Library_v1_by_Murtaza.zip`.

---

**Contact:** Duarte Bustorff · duarte.bustorff@carrocariascsn.pt
