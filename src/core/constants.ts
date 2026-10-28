/**
 * Fundamental and planetary scientific constants
 * All values in SI units. Sources: CODATA 2018 / NASA Planetary Fact Sheets.
 */
export const CONSTANTS = {
  // Planetary surface gravities (m/s^2)
  GRAVITY_EARTH: 9.80665,
  GRAVITY_MOON: 1.62,
  GRAVITY_MARS: 3.72076,
  GRAVITY_JUPITER: 24.79,
  GRAVITY_VENUS: 8.87,

  // Fluid dynamics
  AIR_DENSITY_SEA_LEVEL: 1.225, // kg/m^3 at 15°C and 101.325 kPa

  // Standard universal physical constants
  SPEED_OF_LIGHT: 299792458, // m/s
  PLANCK_CONSTANT: 6.62607015e-34, // J·s
  ELEMENTARY_CHARGE: 1.602176634e-19, // C
  BOLTZMANN_CONSTANT: 1.380649e-23, // J/K
  AVOGADRO_CONSTANT: 6.02214076e23, // mol^-1
  UNIVERSAL_GAS_CONSTANT: 8.314462618, // J/(mol·K)
  VACUUM_PERMITTIVITY: 8.8541878128e-12, // F/m
  VACUUM_PERMEABILITY: 1.25663706212e-6, // N/A^2
  GRAVITATIONAL_CONSTANT: 6.6743e-11 // m^3/(kg·s^2)
} as const;
