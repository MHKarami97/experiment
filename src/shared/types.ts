export interface DataSeries {
  t: number[];
  x: number[];
  y: number[];
  vx: number[];
  vy: number[];
  v: number[];
}

export interface ComparisonRun {
  name: string;
  series: DataSeries;
  color: string;
}

export interface FormulaItem {
  title: string;
  latex: string;
  explanation?: string;
  liveValue?: string;
}

export interface PresetOption {
  id: string;
  label: string;
  params: Record<string, number>;
}

export interface LabStep {
  id: string;
  title: string;
  instruction: string;
  hint?: string;
}
