/**
 * Physics Model: Thermodynamic Heat Cycles & Heat Engines
 *
 * Simulates 4 primary thermodynamic heat cycles:
 * 1. Carnot Cycle (Isothermal expansion -> Isentropic expansion -> Isothermal compression -> Isentropic compression)
 * 2. Otto Cycle (Isentropic compression -> Isochoric heat add -> Isentropic expansion -> Isochoric heat reject)
 * 3. Diesel Cycle (Isentropic compression -> Isobaric heat add -> Isentropic expansion -> Isochoric heat reject)
 * 4. Stirling Cycle (Isothermal expansion -> Isochoric cooling -> Isothermal compression -> Isochoric heating)
 *
 * Implements:
 * - State calculations for all 4 vertices (P, V, T, S, U)
 * - Continuous cycle trajectory V(θ), P(θ), T(θ) as function of crank/cycle phase angle θ ∈ [0, 2π]
 * - Path integrals for net work W = ∮ P dV and heat transfers Q_in, Q_out
 * - Theoretical vs actual real-mode efficiencies with mechanical friction and thermal leaks
 */

export const R_IDEAL_GAS = 8.314462618; // J/(mol*K)

export type CycleType = 'carnot' | 'otto' | 'diesel' | 'stirling';
export type GasType = 'monatomic' | 'diatomic' | 'polyatomic';

export interface GasProperties {
  name: string;
  gamma: number; // Adiabatic index Cp/Cv
  cv: number;    // Molar heat capacity at const volume (J/(mol*K))
  cp: number;    // Molar heat capacity at const pressure (J/(mol*K))
  degreesOfFreedom: number;
}

export const GAS_PROPERTIES: Record<GasType, GasProperties> = {
  monatomic: {
    name: 'Monatomic (He, Ar)',
    degreesOfFreedom: 3,
    gamma: 5 / 3, // ~1.667
    cv: 1.5 * R_IDEAL_GAS,
    cp: 2.5 * R_IDEAL_GAS
  },
  diatomic: {
    name: 'Diatomic (Air, N2, O2)',
    degreesOfFreedom: 5,
    gamma: 7 / 5, // 1.400
    cv: 2.5 * R_IDEAL_GAS,
    cp: 3.5 * R_IDEAL_GAS
  },
  polyatomic: {
    name: 'Polyatomic (CO2)',
    degreesOfFreedom: 6,
    gamma: 4 / 3, // ~1.333
    cv: 3.0 * R_IDEAL_GAS,
    cp: 4.0 * R_IDEAL_GAS
  }
};

export interface EngineStatePoint {
  index: 1 | 2 | 3 | 4;
  pressure: number;    // Pa
  volume: number;      // m^3
  temperature: number; // K
  entropy: number;     // J/K (relative to state 1)
  internalEnergy: number; // J (relative to 0 K: n * Cv * T)
}

export interface EngineParams {
  cycleType: CycleType;
  gasType: GasType;
  moles: number;              // mol, e.g. 0.05
  th: number;                 // Hot temperature or max combustion temp (K)
  tc: number;                 // Cold reservoir / intake temp (K)
  compressionRatio: number;   // r = V_max / V_min
  cutOffRatio?: number;       // r_c for Diesel, default 2.0
  vMin?: number;              // Min volume in m^3 (default 0.0005 m^3 = 0.5 L)
  realMode: boolean;
  frictionCoeff?: number;     // Friction loss fraction (e.g. 0.05 = 5%)
  heatLeakCoeff?: number;     // Thermal conductance loss to ambient (W/K)
}

export interface CycleMetrics {
  states: [EngineStatePoint, EngineStatePoint, EngineStatePoint, EngineStatePoint];
  qIn: number;              // J per cycle
  qOut: number;             // J per cycle (magnitude |Q_out|)
  workNetIdeal: number;     // J per cycle
  workNetReal: number;      // J per cycle
  thermalEfficiencyIdeal: number; // η_ideal ∈ [0, 1]
  thermalEfficiencyReal: number;  // η_real ∈ [0, 1]
  carnotLimit: number;            // 1 - Tc/Th
  meanEffectivePressure: number;  // MEP = W_net / (V_max - V_min) in Pa
  power: number;                  // Watts at given RPM
}

export interface InstantaneousState {
  phase: number;             // Radians in cycle [0, 2π]
  strokeIndex: 1 | 2 | 3 | 4;// Current stroke (1: 1->2, 2: 2->3, 3: 3->4, 4: 4->1)
  strokeNameKey: string;     // Translation key for current stroke
  volume: number;            // m^3
  pressure: number;          // Pa
  temperature: number;       // K
  pistonPosition: number;    // Normalized [0, 1] (0 = top dead center TDC, 1 = bottom dead center BDC)
  flameIntensity: number;    // Normalized [0, 1] for visual combustion/heat addition
  exhaustActive: boolean;    // For exhaust stroke
}

/**
 * Calculates the 4 state points and key thermodynamic performance metrics of the engine.
 */
export function calculateCycleMetrics(params: EngineParams, rpm: number = 60): CycleMetrics {
  const {
    cycleType,
    gasType,
    moles,
    th,
    tc,
    compressionRatio: r,
    cutOffRatio: rcInput = 2.0,
    realMode,
    frictionCoeff = 0.06,
    heatLeakCoeff = 0.5
  } = params;

  const gas = GAS_PROPERTIES[gasType];
  const gamma = gas.gamma;
  const cv = gas.cv;
  const cp = gas.cp;
  const R = R_IDEAL_GAS;

  // Base min volume: default 0.5 L = 0.0005 m^3
  const vMin = params.vMin ?? 0.0005;
  const vMax = vMin * r;

  let s1: EngineStatePoint;
  let s2: EngineStatePoint;
  let s3: EngineStatePoint;
  let s4: EngineStatePoint;

  let qIn = 0;
  let qOut = 0;
  let workNetIdeal = 0;
  let efficiencyIdeal = 0;

  const carnotLimit = Math.max(0, 1 - tc / th);

  if (cycleType === 'carnot') {
    // Carnot Cycle:
    // 1 -> 2: Isothermal expansion at Th from V1 to V2 (Q_H in)
    // 2 -> 3: Isentropic expansion from Th to Tc (V2 to V3, T * V^(γ-1) = const)
    // 3 -> 4: Isothermal compression at Tc from V3 to V4 (Q_C out)
    // 4 -> 1: Isentropic compression from Tc to Th (V4 to V1, T * V^(γ-1) = const)
    // Let V1 = vMin.
    // For isentropic legs: (V3 / V2)^(γ-1) = Th / Tc => V3 / V2 = (Th / Tc)^(1 / (γ-1))
    // Also (V4 / V1)^(γ-1) = Th / Tc => V4 / V1 = (Th / Tc)^(1 / (γ-1))
    // Therefore V2 / V1 = V3 / V4 = isothermal expansion ratio r_iso
    // Let total volume span be vMax. Thus V3 = vMax.
    // V2 = V3 / (Th/Tc)^(1/(γ-1))
    // V4 = vMin * (Th/Tc)^(1/(γ-1))
    const adiabaticVolumeRatio = Math.pow(th / tc, 1 / (gamma - 1));
    const v3 = vMax;
    const v2 = Math.max(vMin * 1.05, v3 / adiabaticVolumeRatio);
    const v1 = vMin;
    const v4 = Math.min(vMax * 0.95, v1 * adiabaticVolumeRatio);

    // Pressures: P = n R T / V
    const p1 = (moles * R * th) / v1;
    const p2 = (moles * R * th) / v2;
    const p3 = (moles * R * tc) / v3;
    const p4 = (moles * R * tc) / v4;

    qIn = moles * R * th * Math.log(v2 / v1);
    qOut = moles * R * tc * Math.log(v3 / v4);
    workNetIdeal = qIn - qOut;
    efficiencyIdeal = carnotLimit;

    s1 = { index: 1, pressure: p1, volume: v1, temperature: th, entropy: 0, internalEnergy: moles * cv * th };
    s2 = { index: 2, pressure: p2, volume: v2, temperature: th, entropy: moles * R * Math.log(v2 / v1), internalEnergy: moles * cv * th };
    s3 = { index: 3, pressure: p3, volume: v3, temperature: tc, entropy: moles * R * Math.log(v2 / v1), internalEnergy: moles * cv * tc };
    s4 = { index: 4, pressure: p4, volume: v4, temperature: tc, entropy: 0, internalEnergy: moles * cv * tc };

  } else if (cycleType === 'otto') {
    // Otto Cycle:
    // State 1: Intake end / compression start: V1 = Vmax, T1 = Tc, P1 = n R Tc / Vmax
    const v1 = vMax;
    const t1 = tc;
    const p1 = (moles * R * t1) / v1;

    // 1 -> 2: Isentropic compression: V2 = Vmin = V1 / r
    // T2 = T1 * (V1 / V2)^(γ-1) = Tc * r^(γ-1)
    const v2 = vMin;
    const t2 = t1 * Math.pow(r, gamma - 1);
    const p2 = (moles * R * t2) / v2;

    // 2 -> 3: Isochoric heat addition (spark ignition): V3 = V2 = Vmin.
    // Temperature rises to peak Th.
    const v3 = v2;
    const t3 = Math.max(th, t2 + 50); // Ensure peak temperature exceeds T2
    const p3 = (moles * R * t3) / v3;
    qIn = moles * cv * (t3 - t2);

    // 3 -> 4: Isentropic expansion (power stroke): V4 = Vmax = V1
    // T4 = T3 * (V3 / V4)^(γ-1) = T3 / r^(γ-1)
    const v4 = v1;
    const t4 = t3 / Math.pow(r, gamma - 1);
    const p4 = (moles * R * t4) / v4;
    qOut = moles * cv * (t4 - t1);

    workNetIdeal = qIn - qOut;
    efficiencyIdeal = 1 - 1 / Math.pow(r, gamma - 1);

    s1 = { index: 1, pressure: p1, volume: v1, temperature: t1, entropy: 0, internalEnergy: moles * cv * t1 };
    s2 = { index: 2, pressure: p2, volume: v2, temperature: t2, entropy: 0, internalEnergy: moles * cv * t2 };
    s3 = { index: 3, pressure: p3, volume: v3, temperature: t3, entropy: moles * cv * Math.log(t3 / t2), internalEnergy: moles * cv * t3 };
    s4 = { index: 4, pressure: p4, volume: v4, temperature: t4, entropy: moles * cv * Math.log(t3 / t2), internalEnergy: moles * cv * t4 };

  } else if (cycleType === 'diesel') {
    // Diesel Cycle:
    // State 1: V1 = Vmax, T1 = Tc
    const v1 = vMax;
    const t1 = tc;
    const p1 = (moles * R * t1) / v1;

    // 1 -> 2: Isentropic compression to V2 = Vmin = V1 / r
    const v2 = vMin;
    const t2 = t1 * Math.pow(r, gamma - 1);
    const p2 = (moles * R * t2) / v2;

    // 2 -> 3: Isobaric heat addition (fuel injection at constant pressure P2)
    // Cut-off ratio rc = V3 / V2
    // Limit rc so V3 does not exceed Vmax
    const rc = Math.min(Math.max(1.1, rcInput), r * 0.8);
    const v3 = v2 * rc;
    const p3 = p2;
    const t3 = t2 * rc; // By Charles's Law at constant P: T3/T2 = V3/V2 = rc
    qIn = moles * cp * (t3 - t2);

    // 3 -> 4: Isentropic expansion to V4 = Vmax
    // Expansion ratio r_exp = V4 / V3 = Vmax / (v2 * rc) = r / rc
    const v4 = v1;
    const t4 = t3 / Math.pow(r / rc, gamma - 1);
    const p4 = (moles * R * t4) / v4;

    // 4 -> 1: Isochoric heat rejection
    qOut = moles * cv * (t4 - t1);
    workNetIdeal = qIn - qOut;

    // Diesel theoretical efficiency: η = 1 - (1 / r^(γ-1)) * [(rc^γ - 1) / (γ * (rc - 1))]
    const dieselFactor = (Math.pow(rc, gamma) - 1) / (gamma * (rc - 1));
    efficiencyIdeal = 1 - (1 / Math.pow(r, gamma - 1)) * dieselFactor;

    s1 = { index: 1, pressure: p1, volume: v1, temperature: t1, entropy: 0, internalEnergy: moles * cv * t1 };
    s2 = { index: 2, pressure: p2, volume: v2, temperature: t2, entropy: 0, internalEnergy: moles * cv * t2 };
    s3 = { index: 3, pressure: p3, volume: v3, temperature: t3, entropy: moles * cp * Math.log(t3 / t2), internalEnergy: moles * cv * t3 };
    s4 = { index: 4, pressure: p4, volume: v4, temperature: t4, entropy: moles * cp * Math.log(t3 / t2), internalEnergy: moles * cv * t4 };

  } else {
    // Stirling Cycle (with regenerative heat exchanger):
    // 1 -> 2: Isothermal expansion at Th from Vmin to Vmax (external heat addition)
    // 2 -> 3: Isochoric cooling from Th to Tc at Vmax (regenerator absorbs heat Q_reg = n Cv (Th - Tc))
    // 3 -> 4: Isothermal compression at Tc from Vmax to Vmin (heat rejected to heat sink)
    // 4 -> 1: Isochoric heating from Tc to Th at Vmin (regenerator releases heat back to gas)
    const v1 = vMin;
    const t1 = th;
    const p1 = (moles * R * t1) / v1;

    const v2 = vMax;
    const t2 = th;
    const p2 = (moles * R * t2) / v2;

    const v3 = vMax;
    const t3 = tc;
    const p3 = (moles * R * t3) / v3;

    const v4 = vMin;
    const t4 = tc;
    const p4 = (moles * R * t4) / v4;

    qIn = moles * R * th * Math.log(vMax / vMin);
    qOut = moles * R * tc * Math.log(vMax / vMin);
    workNetIdeal = qIn - qOut;
    // With ideal 100% regeneration, η = 1 - Tc / Th = Carnot efficiency!
    efficiencyIdeal = carnotLimit;

    s1 = { index: 1, pressure: p1, volume: v1, temperature: t1, entropy: 0, internalEnergy: moles * cv * t1 };
    s2 = { index: 2, pressure: p2, volume: v2, temperature: t2, entropy: moles * R * Math.log(v2 / v1), internalEnergy: moles * cv * t2 };
    s3 = { index: 3, pressure: p3, volume: v3, temperature: t3, entropy: moles * R * Math.log(v2 / v1) + moles * cv * Math.log(t3 / t2), internalEnergy: moles * cv * t3 };
    s4 = { index: 4, pressure: p4, volume: v4, temperature: t4, entropy: moles * cv * Math.log(t4 / t1), internalEnergy: moles * cv * t4 };
  }

  // Real Mode Adjustments:
  // Mechanical piston friction consumes a fraction of net work.
  // Thermal conduction loss between cylinder and ambient lowers effective Q_in and increases effective loss.
  let workNetReal = workNetIdeal;
  let efficiencyReal = efficiencyIdeal;

  if (realMode) {
    const cyclePeriod = 60 / Math.max(1, rpm); // seconds per cycle
    const ambientTemp = tc;
    const meanGasTemp = (s1.temperature + s2.temperature + s3.temperature + s4.temperature) / 4;
    const heatLeakLoss = heatLeakCoeff * Math.max(0, meanGasTemp - ambientTemp) * cyclePeriod;

    const frictionLoss = workNetIdeal * frictionCoeff;
    workNetReal = Math.max(0, workNetIdeal - frictionLoss);
    const qInEffective = qIn + heatLeakLoss;
    efficiencyReal = qInEffective > 0 ? workNetReal / qInEffective : 0;
  } else {
    workNetReal = workNetIdeal;
    efficiencyReal = efficiencyIdeal;
  }

  const deltaV = vMax - vMin;
  const meanEffectivePressure = deltaV > 0 ? (workNetReal / deltaV) : 0;
  const cycleFreqHz = rpm / 60;
  const power = workNetReal * cycleFreqHz; // Watts

  return {
    states: [s1, s2, s3, s4],
    qIn,
    qOut,
    workNetIdeal,
    workNetReal,
    thermalEfficiencyIdeal: Math.max(0, Math.min(1, efficiencyIdeal)),
    thermalEfficiencyReal: Math.max(0, Math.min(1, efficiencyReal)),
    carnotLimit,
    meanEffectivePressure,
    power
  };
}

/**
 * Calculates continuous trajectory and instantaneous state of the engine as a function of cycle phase θ ∈ [0, 2π].
 * In 4-stroke cycle, each quadrant [0, π/2], [π/2, π], [π, 3π/2], [3π/2, 2π] maps to stroke 1, 2, 3, 4.
 */
export function calculateInstantaneousState(
  phase: number,
  metrics: CycleMetrics,
  params: EngineParams
): InstantaneousState {
  // Normalize phase to [0, 2π)
  const twoPi = 2 * Math.PI;
  const normPhase = ((phase % twoPi) + twoPi) % twoPi;
  const [s1, s2, s3, s4] = metrics.states;
  const gamma = GAS_PROPERTIES[params.gasType].gamma;
  const R = R_IDEAL_GAS;
  const n = params.moles;

  const quadrant = normPhase / (Math.PI / 2);
  const stroke = Math.floor(quadrant) + 1;
  const strokeProg = quadrant - Math.floor(quadrant); // Progress inside stroke [0, 1]

  let vol = s1.volume;
  let p = s1.pressure;
  let temp = s1.temperature;
  let strokeIndex: 1 | 2 | 3 | 4 = 1;
  let strokeNameKey = 'heatEngines.stroke1';
  let flameIntensity = 0;
  let exhaustActive = false;

  const { cycleType } = params;

  if (stroke === 1) {
    // State 1 -> State 2
    strokeIndex = 1;
    strokeNameKey = 'heatEngines.stroke1';
    if (cycleType === 'carnot') {
      // Isothermal expansion at Th: P * V = const
      vol = s1.volume + strokeProg * (s2.volume - s1.volume);
      temp = s1.temperature;
      p = (n * R * temp) / vol;
      flameIntensity = 0.7; // Absorbing heat from Th
    } else if (cycleType === 'otto' || cycleType === 'diesel') {
      // Isentropic compression: P * V^γ = const, T * V^(γ-1) = const
      vol = s1.volume + strokeProg * (s2.volume - s1.volume);
      vol = Math.max(s2.volume, vol);
      p = s1.pressure * Math.pow(s1.volume / vol, gamma);
      temp = (p * vol) / (n * R);
      flameIntensity = 0;
    } else {
      // Stirling: Isothermal expansion at Th
      vol = s1.volume + strokeProg * (s2.volume - s1.volume);
      temp = s1.temperature;
      p = (n * R * temp) / vol;
      flameIntensity = 0.8;
    }
  } else if (stroke === 2) {
    // State 2 -> State 3
    strokeIndex = 2;
    strokeNameKey = 'heatEngines.stroke2';
    if (cycleType === 'carnot') {
      // Isentropic expansion: P * V^γ = const
      vol = s2.volume + strokeProg * (s3.volume - s2.volume);
      p = s2.pressure * Math.pow(s2.volume / vol, gamma);
      temp = (p * vol) / (n * R);
      flameIntensity = 0;
    } else if (cycleType === 'otto') {
      // Isochoric heat addition: V = const = Vmin, P rises to P3
      vol = s2.volume;
      temp = s2.temperature + strokeProg * (s3.temperature - s2.temperature);
      p = (n * R * temp) / vol;
      flameIntensity = 1.0; // Combustion flash!
    } else if (cycleType === 'diesel') {
      // Isobaric heat addition: P = const = P2, V expands to V3
      vol = s2.volume + strokeProg * (s3.volume - s2.volume);
      p = s2.pressure;
      temp = (p * vol) / (n * R);
      flameIntensity = 0.95; // Diesel combustion
    } else {
      // Stirling: Isochoric cooling: V = const = Vmax, T drops to Tc
      vol = s2.volume;
      temp = s2.temperature + strokeProg * (s3.temperature - s2.temperature);
      p = (n * R * temp) / vol;
      flameIntensity = 0;
    }
  } else if (stroke === 3) {
    // State 3 -> State 4
    strokeIndex = 3;
    strokeNameKey = 'heatEngines.stroke3';
    if (cycleType === 'carnot') {
      // Isothermal compression at Tc: P * V = const
      vol = s3.volume + strokeProg * (s4.volume - s3.volume);
      temp = s3.temperature;
      p = (n * R * temp) / vol;
      flameIntensity = 0;
    } else if (cycleType === 'otto' || cycleType === 'diesel') {
      // Isentropic expansion (power stroke): P * V^γ = const
      vol = s3.volume + strokeProg * (s4.volume - s3.volume);
      p = s3.pressure * Math.pow(s3.volume / vol, gamma);
      temp = (p * vol) / (n * R);
      flameIntensity = 0.15; // Residual glow
    } else {
      // Stirling: Isothermal compression at Tc
      vol = s3.volume + strokeProg * (s4.volume - s3.volume);
      temp = s3.temperature;
      p = (n * R * temp) / vol;
      flameIntensity = 0;
    }
  } else {
    // State 4 -> State 1
    strokeIndex = 4;
    strokeNameKey = 'heatEngines.stroke4';
    if (cycleType === 'carnot') {
      // Isentropic compression: P * V^γ = const
      vol = s4.volume + strokeProg * (s1.volume - s4.volume);
      p = s4.pressure * Math.pow(s4.volume / vol, gamma);
      temp = (p * vol) / (n * R);
      flameIntensity = 0;
    } else if (cycleType === 'otto' || cycleType === 'diesel') {
      // Isochoric heat rejection: V = const = Vmax
      vol = s4.volume;
      temp = s4.temperature + strokeProg * (s1.temperature - s4.temperature);
      p = (n * R * temp) / vol;
      exhaustActive = true;
      flameIntensity = 0;
    } else {
      // Stirling: Isochoric heating at Vmin: T rises from Tc to Th
      vol = s4.volume;
      temp = s4.temperature + strokeProg * (s1.temperature - s4.temperature);
      p = (n * R * temp) / vol;
      flameIntensity = 0.4;
    }
  }

  // Calculate normalized piston position [0, 1] (0 = TDC at Vmin, 1 = BDC at Vmax)
  const minV = Math.min(s1.volume, s2.volume, s3.volume, s4.volume);
  const maxV = Math.max(s1.volume, s2.volume, s3.volume, s4.volume);
  const pistonPosition = maxV > minV ? (vol - minV) / (maxV - minV) : 0;

  return {
    phase: normPhase,
    strokeIndex,
    strokeNameKey,
    volume: vol,
    pressure: p,
    temperature: temp,
    pistonPosition,
    flameIntensity,
    exhaustActive
  };
}

/**
 * Generates an array of discrete (V, P) curve points along the entire closed cycle loop
 * for drawing the high-resolution indicator diagram.
 */
export function generateCycleCurvePoints(
  metrics: CycleMetrics,
  params: EngineParams,
  pointsPerStroke: number = 50
): Array<{ v: number; p: number; stroke: 1 | 2 | 3 | 4 }> {
  const points: Array<{ v: number; p: number; stroke: 1 | 2 | 3 | 4 }> = [];
  const strokes: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  for (const stroke of strokes) {
    for (let i = 0; i <= pointsPerStroke; i++) {
      const frac = i / pointsPerStroke;
      // Phase in this stroke
      const phase = (stroke - 1) * (Math.PI / 2) + frac * (Math.PI / 2);
      const state = calculateInstantaneousState(phase, metrics, params);
      points.push({
        v: state.volume,
        p: state.pressure,
        stroke
      });
    }
  }

  return points;
}
