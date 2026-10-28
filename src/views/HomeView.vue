<template>
  <div class="home-view">
    <!-- Hero Banner -->
    <header class="hero-banner glass-card">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="logo-icon">🔬</span>
          {{ $t('app.title') }}
        </h1>
        <p class="hero-subtitle">{{ $t('app.subtitle') }}</p>

        <!-- Search Bar -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="search"
            class="search-input"
            :placeholder="$t('app.searchPlaceholder')"
          />
          <button v-if="searchQuery" type="button" class="clear-btn" @click="searchQuery = ''">✕</button>
        </div>
      </div>
    </header>

    <!-- Filter Bar -->
    <div class="filters-bar">
      <!-- Subjects Filter -->
      <div class="subject-chips">
        <button
          type="button"
          class="subject-chip touch-target"
          :class="{ active: selectedSubject === 'all' }"
          @click="selectedSubject = 'all'"
        >
          🌐 {{ $t('app.allSubjects') }}
        </button>
        <button
          v-for="sub in subjectsList"
          :key="sub.id"
          type="button"
          class="subject-chip touch-target"
          :class="[sub.id, { active: selectedSubject === sub.id }]"
          @click="selectedSubject = sub.id"
        >
          <span class="sub-icon">{{ sub.icon }}</span>
          {{ $t(`subjects.${sub.id}`) }}
        </button>
      </div>

      <!-- Grade Filter Tags -->
      <div class="grade-filter">
        <select v-model="selectedGrade" class="filter-select">
          <option value="all">{{ $t('app.allGrades') }}</option>
          <option value="middle-school">{{ $t('grades.middle-school') }}</option>
          <option value="high-school">{{ $t('grades.high-school') }}</option>
          <option value="university">{{ $t('grades.university') }}</option>
        </select>
      </div>
    </div>

    <!-- Active Experiments Section -->
    <section class="catalog-section">
      <div class="section-header">
        <h2>🧪 {{ $t('home.activeLabs') }}</h2>
        <span class="count-badge">{{ $t('home.labsCount', { count: filteredActiveExperiments.length }) }}</span>
      </div>

      <div class="experiments-grid">
        <div
          v-for="exp in filteredActiveExperiments"
          :key="exp.id"
          class="experiment-card glass-card"
          :class="exp.subject"
          @click="openExperiment(exp.id)"
        >
          <div class="card-top">
            <span class="subject-pill" :class="exp.subject">
              {{ $t(`subjects.${exp.subject}`) }}
            </span>
            <button
              type="button"
              class="fav-btn touch-target"
              :class="{ active: store.isFavorite(exp.id) }"
              @click.stop="store.toggleFavorite(exp.id)"
            >
              {{ store.isFavorite(exp.id) ? '★' : '☆' }}
            </button>
          </div>

          <h3 class="card-title">{{ $t(exp.titleKey) }}</h3>
          <p class="card-desc">{{ $t(exp.descKey) }}</p>

          <div class="card-meta">
            <div class="badges">
              <span class="difficulty-badge" :class="exp.difficulty">
                {{ $t(`difficulty.${exp.difficulty}`) }}
              </span>
              <span v-for="gt in exp.gradeTags" :key="gt" class="grade-badge">
                {{ $t(`grades.${gt}`) }}
              </span>
            </div>
            <span class="status-badge tested">{{ $t('home.readyBadge') }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Upcoming Planned Simulations Catalog -->
    <section class="planned-section">
      <div class="section-header">
        <h2>📚 {{ $t('home.roadmapTitle') }}</h2>
        <span class="count-badge">{{ $t('home.roadmapCount') }}</span>
      </div>

      <div class="planned-grid">
        <div v-for="item in plannedPreviewList" :key="item.id" class="planned-card glass-card">
          <div class="planned-header">
            <span class="planned-subject">{{ item.subject }}</span>
            <span class="planned-status">{{ $t('home.plannedStatus') }}</span>
          </div>
          <div class="planned-title">{{ item.title }}</div>
          <div class="planned-topic">{{ item.topic }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { EXPERIMENT_CATALOG } from '../experiments/registry';
import { useAppStore } from '../app/store';

const router = useRouter();
const store = useAppStore();
const { t } = useI18n();

const searchQuery = ref('');
const selectedSubject = ref('all');
const selectedGrade = ref('all');

const subjectsList = [
  { id: 'physics', icon: '⚡' },
  { id: 'chemistry', icon: '🧪' },
  { id: 'biology', icon: '🧬' },
  { id: 'earth', icon: '🌍' },
  { id: 'math', icon: '📐' },
  { id: 'engineering', icon: '⚙️' },
  { id: 'cs', icon: '💻' },
  { id: 'environment', icon: '🌱' },
  { id: 'psychology', icon: '🧠' },
  { id: 'astronomy', icon: '🔭' },
  { id: 'economics', icon: '📊' }
];

const filteredActiveExperiments = computed(() => {
  return EXPERIMENT_CATALOG.filter((exp) => {
    if (selectedSubject.value !== 'all' && exp.subject !== selectedSubject.value) {
      return false;
    }
    if (selectedGrade.value !== 'all' && !exp.gradeTags.includes(selectedGrade.value as any)) {
      return false;
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const inTitle = exp.id.toLowerCase().includes(q) || exp.topic.toLowerCase().includes(q);
      return inTitle;
    }
    return true;
  });
});

const plannedPreviewList = computed(() => [
  { id: 'p1', subject: t('subjects.physics'), topic: store.locale === 'fa' ? 'حرکت و دینامیک' : 'Motion & Dynamics', title: store.locale === 'fa' ? 'قوانین نیوتن و اصطکاک روی سطح شیب‌دار' : "Newton's Laws & Friction on Inclined Plane" },
  { id: 'p2', subject: t('subjects.physics'), topic: store.locale === 'fa' ? 'کار و انرژی' : 'Work & Energy', title: store.locale === 'fa' ? 'پایستگی انرژی مکانیکی (پیست اسکیت)' : 'Conservation of Mechanical Energy (Skate Park)' },
  { id: 'p3', subject: t('subjects.physics'), topic: store.locale === 'fa' ? 'امواج و صوت' : 'Waves & Sound', title: store.locale === 'fa' ? 'تداخل امواج و اثر دوپلر' : 'Wave Interference & Doppler Effect' },
  { id: 'c1', subject: t('subjects.chemistry'), topic: store.locale === 'fa' ? 'ساختار ماده' : 'Structure of Matter', title: store.locale === 'fa' ? 'ساخت اتم، مولکول و جدول تناوبی عناصر' : 'Build an Atom, Molecule & Periodic Table' },
  { id: 'c2', subject: t('subjects.chemistry'), topic: store.locale === 'fa' ? 'محلول‌ها' : 'Solutions', title: store.locale === 'fa' ? 'منحنی تیتراسیون اسید و باز و سنجش pH' : 'Acid-Base Titration & pH Curves' },
  { id: 'b1', subject: t('subjects.biology'), topic: store.locale === 'fa' ? 'سلول' : 'Cellular Biology', title: store.locale === 'fa' ? 'میکروسکوپ مجازی بافت‌ها و پدیده اسمز' : 'Virtual Microscope, Tissues & Osmosis' },
  { id: 'e1', subject: t('subjects.earth'), topic: store.locale === 'fa' ? 'اخترشناسی' : 'Astronomy', title: store.locale === 'fa' ? 'مقیاس منظومه شمسی و گرفت‌های ماه و خورشید' : 'Solar System Scale, Lunar & Solar Eclipses' },
  { id: 'm1', subject: t('subjects.math'), topic: store.locale === 'fa' ? 'هندسه' : 'Geometry', title: store.locale === 'fa' ? 'دایره مثلثاتی تعاملی و تبدیلات هندسی' : 'Interactive Unit Circle & Geometric Transforms' }
]);

function openExperiment(id: string) {
  router.push(`/experiment/${id}`);
}
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  max-width: 1400px;
  margin: 0 auto;
}

.hero-banner {
  padding: var(--space-6);
  border-radius: var(--radius-2xl);
  text-align: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08));
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.hero-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  font-size: 2.4rem;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
}

.search-box {
  width: 100%;
  max-width: 550px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--surface-card-solid);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  padding: var(--space-2) var(--space-4);
  box-shadow: var(--shadow-md);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.clear-btn {
  color: var(--text-muted);
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.subject-chips {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.subject-chip {
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
  border-radius: var(--radius-full);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all var(--transition-fast);
}

.subject-chip:hover {
  background: var(--surface-hover);
  border-color: var(--border-focus);
}

.subject-chip.active {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
  font-weight: 600;
}

.filter-select {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-card);
  color: var(--text-primary);
  font-size: 0.85rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.section-header h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.count-badge {
  font-size: 0.8rem;
  background: var(--surface-hover);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  color: var(--text-muted);
}

.experiments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: var(--space-4);
}

.experiment-card {
  padding: var(--space-4);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-inline-start: 4px solid var(--color-physics);
}

.experiment-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  background: rgba(59, 130, 246, 0.15);
  color: var(--color-physics);
}

.fav-btn {
  font-size: 1.2rem;
  color: var(--text-muted);
}

.fav-btn.active {
  color: var(--color-warning);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  gap: var(--space-2);
}

.badges {
  display: flex;
  gap: var(--space-1);
}

.difficulty-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  color: var(--text-secondary);
}

.grade-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--surface-hover);
  color: var(--text-muted);
}

.status-badge.tested {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-success);
}

.planned-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: var(--space-3);
}

.planned-card {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  opacity: 0.75;
}

.planned-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.planned-subject {
  font-weight: 600;
  color: var(--color-physics);
}

.planned-status {
  color: var(--text-muted);
}

.planned-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.planned-topic {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .home-view {
    padding: var(--space-2);
    gap: var(--space-4);
  }
  .hero-banner {
    padding: var(--space-4) var(--space-3);
  }
  .hero-title {
    font-size: 1.5rem;
  }
  .logo-icon {
    font-size: 1.8rem;
  }
  .hero-subtitle {
    font-size: 0.9rem;
  }
  .section-header h2 {
    font-size: 1.1rem;
  }
}
</style>
