import type { Component } from 'vue';

export interface ExperimentVariableDef {
  id: string;
  labelKey: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  descKey: string;
  realModeEffect: string | null;
}

export interface ExperimentPresetDef {
  id: string;
  labelKey: string;
  descKey?: string;
  params: Record<string, number>;
}

export interface ExperimentToolDef {
  id: string;
  nameKey: string;
  icon: string;
}

export interface ExperimentFormulaDef {
  titleKey: string;
  latex: string;
  explanationKey: string;
}

export interface ExperimentConfig {
  id: string;
  subject:
    | 'physics'
    | 'chemistry'
    | 'biology'
    | 'earth'
    | 'math'
    | 'engineering'
    | 'cs'
    | 'environment'
    | 'psychology'
    | 'astronomy'
    | 'economics';
  topic: string;
  titleKey: string;
  descKey: string;
  gradeTags: ('middle-school' | 'high-school' | 'university')[];
  difficulty: 'easy' | 'medium' | 'advanced';
  engine: 'canvas2d' | 'threejs';
  variables: ExperimentVariableDef[];
  presets: ExperimentPresetDef[];
  tools: ExperimentToolDef[];
  formulas: ExperimentFormulaDef[];
}

export interface ExperimentPlugin {
  config: ExperimentConfig;
  component: Component;
  messages: {
    fa: Record<string, any>;
    en: Record<string, any>;
  };
}

export interface ExperimentCatalogItem {
  id: string;
  subject: ExperimentConfig['subject'];
  topic: string;
  titleKey: string;
  descKey: string;
  gradeTags: ExperimentConfig['gradeTags'];
  difficulty: ExperimentConfig['difficulty'];
  engine: ExperimentConfig['engine'];
  status: 'planned' | 'in-progress' | 'built' | 'tested';
  load: () => Promise<ExperimentPlugin>;
}

export const EXPERIMENT_CATALOG: ExperimentCatalogItem[] = [
  {
    id: 'physics/motion/projectile',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.projectile.title',
    descKey: 'experiments.projectile.description',
    gradeTags: ['high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/projectile/config'),
        import('./physics/motion/projectile/ui/Experiment.vue'),
        import('./physics/motion/projectile/i18n/fa.json'),
        import('./physics/motion/projectile/i18n/en.json')
      ]);
      return {
        config: configModule.projectileConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/1d-2d-kinematics',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.kinematics.title',
    descKey: 'experiments.kinematics.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'easy',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/1d-2d-kinematics/config'),
        import('./physics/motion/1d-2d-kinematics/ui/Experiment.vue'),
        import('./physics/motion/1d-2d-kinematics/i18n/fa.json'),
        import('./physics/motion/1d-2d-kinematics/i18n/en.json')
      ]);
      return {
        config: configModule.kinematicsConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/newton-inclined-plane',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.inclinedPlane.title',
    descKey: 'experiments.inclinedPlane.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/newton-inclined-plane/config'),
        import('./physics/motion/newton-inclined-plane/ui/Experiment.vue'),
        import('./physics/motion/newton-inclined-plane/i18n/fa.json'),
        import('./physics/motion/newton-inclined-plane/i18n/en.json')
      ]);
      return {
        config: configModule.inclinedPlaneConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  },
  {
    id: 'physics/motion/pulleys-levers',
    subject: 'physics',
    topic: 'motion',
    titleKey: 'experiments.pulleysLevers.title',
    descKey: 'experiments.pulleysLevers.description',
    gradeTags: ['middle-school', 'high-school', 'university'],
    difficulty: 'medium',
    engine: 'canvas2d',
    status: 'tested',
    load: async () => {
      const [configModule, uiModule, faModule, enModule] = await Promise.all([
        import('./physics/motion/pulleys-levers/config'),
        import('./physics/motion/pulleys-levers/ui/Experiment.vue'),
        import('./physics/motion/pulleys-levers/i18n/fa.json'),
        import('./physics/motion/pulleys-levers/i18n/en.json')
      ]);
      return {
        config: configModule.pulleysLeversConfig,
        component: uiModule.default,
        messages: {
          fa: faModule.default,
          en: enModule.default
        }
      };
    }
  }
];

export function getExperimentById(id: string): ExperimentCatalogItem | undefined {
  return EXPERIMENT_CATALOG.find((exp) => exp.id === id);
}

export function getExperimentsBySubject(subject: string): ExperimentCatalogItem[] {
  return EXPERIMENT_CATALOG.filter((exp) => exp.subject === subject);
}
