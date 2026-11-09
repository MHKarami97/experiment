/**
 * Physical model for Calorimetry & Specific Heat Capacity.
 * Pure TypeScript — no DOM, no Vue dependencies.
 */

export type SolidMaterial = 'copper' | 'aluminum' | 'iron' | 'lead' | 'glass' | 'ice';
export type LiquidMedium = 'water' | 'ethanol' | 'oil';

export interface SubstanceProperties {
  name: string;
  specificHeat: number; // J / (kg * K)
  density: number; // kg / m^3
  latentHeatFusion?: number; // J / kg
  meltingPointC?: number; // °C
}

export const SOLID_MATERIALS: Record<SolidMaterial, SubstanceProperties> = {
  copper: { name: 'copper', specificHeat: 385, density: 8960 },
  aluminum: { name: 'aluminum', specificHeat: 900, density: 2700 },
  iron: { name: 'iron', specificHeat: 450, density: 7870 },
  lead: { name: 'lead', specificHeat: 128, density: 11340 },
  glass: { name: 'glass', specificHeat: 840, density: 2500 },
  ice: { name: 'ice', specificHeat: 2090, density: 917, latentHeatFusion: 334000, meltingPointC: 0 },
};

export const LIQUID_MEDIA: Record<LiquidMedium, SubstanceProperties> = {
  water: { name: 'water', specificHeat: 4184, density: 1000 },
  ethanol: { name: 'ethanol', specificHeat: 2440, density: 789 },
  oil: { name: 'oil', specificHeat: 2000, density: 920 },
};

export interface CalorimetryParams {
  solidMaterial: SolidMaterial;
  solidMassGrams: number; // mass of sample in grams
  solidInitialTempC: number; // initial temperature of sample in °C

  liquidMedium: LiquidMedium;
  liquidMassGrams: number; // mass of liquid in grams
  liquidInitialTempC: number; // initial temperature of liquid in °C

  calorimeterWaterEquivalentGrams: number; // water equivalent (C_cal / c_w) in grams (default ~ 15g)
  ambientTempC: number; // surrounding ambient temperature in °C
  stirrerActive: boolean; // increases heat exchange rate
  isRealMode: boolean; // enables calorimeter thermal inertia and thermal leakage
}

export interface CalorimetryDerived {
  theoreticalEquilibriumTempC: number; // analytical final T_eq (°C)
  heatTransferredJoules: number; // Q transferred between solid and liquid (J)
  iceMeltedFraction: number; // 0..1 if ice is used
  calorimeterHeatCapacityJPerK: number; // C_cal = m_we * c_w (J/K)
  systemTotalHeatCapacity: number; // (J/K)
}

export interface CalorimetryState {
  t: number; // simulation time in seconds
  liquidTempC: number; // current dynamic liquid temperature (°C)
  solidTempC: number; // current dynamic sample temperature (°C)
  isEquilibrated: boolean;
  iceRemainingGrams: number;
  derived: CalorimetryDerived;
}

/**
 * Compute theoretical equilibrium temperature using analytical conservation of thermal energy:
 * Q_solid + Q_liquid + Q_cal = 0
 */
export function computeEquilibrium(params: CalorimetryParams): CalorimetryDerived {
  const solidProp = SOLID_MATERIALS[params.solidMaterial];
  const liquidProp = LIQUID_MEDIA[params.liquidMedium];

  const mSolid = params.solidMassGrams / 1000; // kg
  const mLiquid = params.liquidMassGrams / 1000; // kg
  const mCalEquiv = params.isRealMode ? params.calorimeterWaterEquivalentGrams / 1000 : 0; // kg

  const cSolid = solidProp.specificHeat;
  const cLiquid = liquidProp.specificHeat;
  const cCal = 4184; // Water equivalent uses c_water

  const cCalTotal = mCalEquiv * cCal;
  const totalHeatCap = mSolid * cSolid + mLiquid * cLiquid + cCalTotal;

  // Standard case without phase change (or ice above 0°C)
  if (params.solidMaterial !== 'ice') {
    // T_eq = (m_s * c_s * T_s + (m_liq * c_liq + C_cal) * T_liq) / (m_s * c_s + m_liq * c_liq + C_cal)
    const numerator =
      mSolid * cSolid * params.solidInitialTempC +
      (mLiquid * cLiquid + cCalTotal) * params.liquidInitialTempC;
    const tEq = numerator / totalHeatCap;

    const qExchanged = Math.abs(mSolid * cSolid * (tEq - params.solidInitialTempC));

    return {
      theoreticalEquilibriumTempC: tEq,
      heatTransferredJoules: qExchanged,
      iceMeltedFraction: 0,
      calorimeterHeatCapacityJPerK: cCalTotal,
      systemTotalHeatCapacity: totalHeatCap,
    };
  }

  // Ice phase change case (fusion)
  const lFusion = solidProp.latentHeatFusion || 334000;
  const tIce0 = Math.min(0, params.solidInitialTempC);

  // 1. Heat required to warm ice from tIce0 to 0°C
  const qWarmIce = mSolid * cSolid * (0 - tIce0);

  // 2. Heat available in warm liquid cooling down to 0°C
  const qAvailableToCool = (mLiquid * cLiquid + cCalTotal) * (params.liquidInitialTempC - 0);

  if (qAvailableToCool < qWarmIce) {
    // Not even enough heat to warm ice to 0°C; final state is all solid/frozen at T < 0°C
    const tFinal = (mSolid * cSolid * tIce0 + (mLiquid * cLiquid + cCalTotal) * params.liquidInitialTempC) / totalHeatCap;
    return {
      theoreticalEquilibriumTempC: tFinal,
      heatTransferredJoules: qAvailableToCool,
      iceMeltedFraction: 0,
      calorimeterHeatCapacityJPerK: cCalTotal,
      systemTotalHeatCapacity: totalHeatCap,
    };
  }

  const remainingQAfterWarming = qAvailableToCool - qWarmIce;
  const qNeededToMeltAllIce = mSolid * lFusion;

  if (remainingQAfterWarming < qNeededToMeltAllIce) {
    // Ice partially melts; mixture stays at exactly 0°C
    const meltedFraction = remainingQAfterWarming / qNeededToMeltAllIce;
    return {
      theoreticalEquilibriumTempC: 0.0,
      heatTransferredJoules: qWarmIce + remainingQAfterWarming,
      iceMeltedFraction: meltedFraction,
      calorimeterHeatCapacityJPerK: cCalTotal,
      systemTotalHeatCapacity: totalHeatCap,
    };
  }

  // All ice melts into water at 0°C, then warms up above 0°C
  const excessQ = remainingQAfterWarming - qNeededToMeltAllIce;
  // Now melted ice is liquid water with c = 4184
  const cMeltedWater = 4184;
  const postMeltTotalCapacity = mSolid * cMeltedWater + mLiquid * cLiquid + cCalTotal;
  const tFinal = excessQ / postMeltTotalCapacity;

  return {
    theoreticalEquilibriumTempC: tFinal,
    heatTransferredJoules: qWarmIce + qNeededToMeltAllIce + mSolid * cMeltedWater * tFinal,
    iceMeltedFraction: 1.0,
    calorimeterHeatCapacityJPerK: cCalTotal,
    systemTotalHeatCapacity: postMeltTotalCapacity,
  };
}

/**
 * Initialize calorimetry state.
 */
export function createCalorimetryModel(params: CalorimetryParams): CalorimetryState {
  const derived = computeEquilibrium(params);
  return {
    t: 0,
    liquidTempC: params.liquidInitialTempC,
    solidTempC: params.solidInitialTempC,
    isEquilibrated: false,
    iceRemainingGrams: params.solidMaterial === 'ice' ? params.solidMassGrams : 0,
    derived,
  };
}

/**
 * Step dynamic heat exchange between solid sample, liquid, calorimeter and surroundings.
 * Newton's law of cooling differential rate:
 * dQ/dt = k_exchange * (T_solid - T_liquid)
 */
export function stepCalorimetryModel(
  state: CalorimetryState,
  params: CalorimetryParams,
  dt: number,
): CalorimetryState {
  const solidProp = SOLID_MATERIALS[params.solidMaterial];
  const liquidProp = LIQUID_MEDIA[params.liquidMedium];

  const mSolid = params.solidMassGrams / 1000; // kg
  const mLiquid = params.liquidMassGrams / 1000; // kg
  const mCalEquiv = params.isRealMode ? params.calorimeterWaterEquivalentGrams / 1000 : 0; // kg

  const capSolid = Math.max(1, mSolid * solidProp.specificHeat);
  const capLiquid = Math.max(1, mLiquid * liquidProp.specificHeat + mCalEquiv * 4184);

  // Overall heat exchange coefficient (enhanced by stirrer)
  const stirrerBoost = params.stirrerActive ? 2.5 : 1.0;
  const kExchange = 18.0 * stirrerBoost; // W/K exchange rate between submerged body & bath

  // Temperature difference driving thermal exchange
  const deltaT = state.solidTempC - state.liquidTempC;
  const rateWatts = kExchange * deltaT;

  // Real mode thermal leakage to ambient room air
  let ambientLeakWatts = 0;
  if (params.isRealMode) {
    const kLeakCalorimeter = 0.35; // W/K leakage through insulation lid & walls
    ambientLeakWatts = kLeakCalorimeter * (state.liquidTempC - params.ambientTempC);
  }

  // Energy transferred in time dt
  const dQ = rateWatts * dt;
  const dQLeak = ambientLeakWatts * dt;

  let newSolidTemp = state.solidTempC - dQ / capSolid;
  let newLiquidTemp = state.liquidTempC + (dQ - dQLeak) / capLiquid;

  // Handle ice phase change clamping at 0°C during melting
  let newIceRemaining = state.iceRemainingGrams;
  if (params.solidMaterial === 'ice' && newIceRemaining > 0) {
    if (newSolidTemp >= 0 && state.liquidTempC > 0) {
      newSolidTemp = 0;
      // Energy going into melting ice: dQ_melt = kExchange * (T_liq - 0) * dt
      const meltEnergyJ = Math.max(0, kExchange * state.liquidTempC * dt);
      const lFusion = solidProp.latentHeatFusion || 334000;
      const meltedGrams = (meltEnergyJ / lFusion) * 1000;

      newIceRemaining = Math.max(0, newIceRemaining - meltedGrams);
      newLiquidTemp -= meltEnergyJ / capLiquid;

      if (newIceRemaining === 0) {
        newSolidTemp = 0; // melted into water at 0°C
      }
    }
  }

  // Check equilibrium status
  const isEq = Math.abs(newSolidTemp - newLiquidTemp) < 0.05;
  if (isEq && !params.isRealMode) {
    // Snap to exact theoretical equilibrium in ideal mode when converged
    newSolidTemp = state.derived.theoreticalEquilibriumTempC;
    newLiquidTemp = state.derived.theoreticalEquilibriumTempC;
  }

  return {
    t: state.t + dt,
    liquidTempC: newLiquidTemp,
    solidTempC: newSolidTemp,
    isEquilibrated: isEq,
    iceRemainingGrams: newIceRemaining,
    derived: state.derived,
  };
}
