<template>
  <div class="export-report-dialog">
    <div class="export-options">
      <h4>انتخاب قالب خروجی</h4>
      <div class="buttons-grid">
        <button type="button" class="btn-action primary touch-target" :disabled="isGenerating" @click="downloadPdf">
          📄 {{ isGenerating ? 'در حال ایجاد PDF...' : 'دانلود گزارش PDF (با رسم کامل)' }}
        </button>
        <button type="button" class="btn-action touch-target" @click="printPdf">
          🖨️ چاپ / ذخیره با مرورگر (متن قابل انتخاب)
        </button>
        <button type="button" class="btn-action touch-target" @click="exportJson">
          💾 دانلود داده خام آزمایش (JSON)
        </button>
        <button type="button" class="btn-action touch-target" @click="exportPng">
          🖼️ ذخیره تصویر صحنه (PNG)
        </button>
        <button type="button" class="btn-action touch-target" @click="copyShareLink">
          🔗 کپی پیوند اشتراک آنلاین
        </button>
      </div>
    </div>

    <!-- Hidden / Print A4 Report Template -->
    <div class="print-container">
      <div ref="reportElement" class="a4-report" dir="rtl">
        <header class="report-header">
          <div class="header-main">
            <h1 class="report-title">{{ title }}</h1>
            <p class="report-meta">
              <span>تاریخ گزارش: {{ reportDate }}</span> |
              <span>حالت شبیه‌سازی: {{ mode === 'ideal' ? 'ایده‌آل (بدون مقاومت هوا)' : 'واقعی (با مقاومت آیرودینامیک و باد)' }}</span>
            </p>
          </div>
          <div class="header-badge">آزمایشگاه مجازی علوم</div>
        </header>

        <section class="report-section">
          <h2>۱. هدف آزمایش (Objective)</h2>
          <p>{{ objectiveText }}</p>
        </section>

        <section class="report-section">
          <h2>۲. ابزارها و دستگاه‌ها (Apparatus)</h2>
          <p>{{ apparatusText }}</p>
        </section>

        <section class="report-section">
          <h2>۳. متغیرها و پارامترهای آزمایش (Variables)</h2>
          <table class="report-table">
            <thead>
              <tr>
                <th>متغیر</th>
                <th>نماد</th>
                <th>مقدار تنظیمی</th>
                <th>واحد (SI)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in effectiveVariablesList" :key="v.name">
                <td>{{ v.name }}</td>
                <td class="ltr">{{ v.symbol }}</td>
                <td class="ltr">{{ v.value }}</td>
                <td class="ltr">{{ v.unit }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="report-section" v-if="graphSnapshot">
          <h2>۴. نمودار مسیر حرکت (Trajectory Graph)</h2>
          <div class="report-graph-img-wrap">
            <img :src="graphSnapshot" alt="نمودار آزمایش" class="report-graph-img" />
          </div>
        </section>

        <section class="report-section">
          <h2>۵. نتایج آزمایش و مقایسه با نظریه (Results & Comparison)</h2>
          <table class="report-table">
            <thead>
              <tr>
                <th>کمیت فیزیکی</th>
                <th>مقدار شبیه‌سازی‌شده</th>
                <th>مقدار نظری (تحلیلی)</th>
                <th>درصد خطا / اختلاف</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in finalResultsRows" :key="idx">
                <td>{{ row.name }}</td>
                <td class="ltr">{{ row.simulated }}</td>
                <td class="ltr">{{ row.theoretical ?? '—' }}</td>
                <td class="ltr">{{ row.error ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="report-section">
          <h2>۶. تحلیل خطای آزمایش (Error Analysis)</h2>
          <p>{{ errorAnalysisText }}</p>
        </section>

        <section class="report-section" v-if="notes">
          <h2>۷. یادداشت‌های کاربر (User Notes)</h2>
          <p class="user-notes-text">{{ notes }}</p>
        </section>

        <section class="report-section">
          <h2>۸. نتیجه‌گیری علمی (Conclusion)</h2>
          <p>{{ conclusionText }}</p>
        </section>

        <footer class="report-footer">
          تولید شده توسط آزمایشگاه مجازی علوم (Virtual Science Lab) — نسخه ۱.۰ آفلاین
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import LZString from 'lz-string';
import { formatScientificValue } from '../core/units';
import { useAppStore } from '../app/store';

const props = withDefaults(
  defineProps<{
    title: string;
    mode: 'ideal' | 'real';
    params: Record<string, number>;
    results?: Record<string, any>;
    resultsRows?: Array<{
      name: string;
      simulated: string;
      theoretical?: string;
      error?: string;
    }>;
    variablesList?: Array<{
      name: string;
      symbol: string;
      value: number | string;
      unit: string;
    }>;
    objective?: string;
    apparatus?: string;
    errorAnalysis?: string;
    conclusion?: string;
    notes?: string;
    sceneCanvas?: HTMLCanvasElement | null;
  }>(),
  {
    notes: '',
    sceneCanvas: null
  }
);

const store = useAppStore();
const reportElement = ref<HTMLDivElement | null>(null);
const isGenerating = ref(false);
const graphSnapshot = ref<string>('');

const reportDate = computed(() => {
  return new Intl.DateTimeFormat(store.locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());
});

const objectiveText = computed(() => props.objective || 'بررسی رفتار فیزیکی و مقایسه داده‌های تجربی با معادلات حاکم بر حرکت.');
const apparatusText = computed(() => props.apparatus || 'سامانه شبیه‌سازی فیزیکی، سنسورهای سرعت‌سنج و موقعیت‌یاب، ثبت‌کننده زمانی.');
const errorAnalysisText = computed(() => props.errorAnalysis || 'در حالت ایده‌آل خطای عددی ناشی از گام زمانی انتگرال‌گیر رانگ-کوتا (RK4) کمتر از ۰.۱٪ است. در حالت واقعی، اتلاف انرژی ناشی از اصطکاک و مقاومت محیطی باعث کاهش کمیت‌ها می‌شود.');
const conclusionText = computed(() => props.conclusion || 'نتایج به‌دست‌آمده تطابق بالایی با مدل‌های تحلیلی استاندارد فیزیک دارند و اثر عوامل مقاومتی در اتلاف انرژی به‌خوبی ثبت شد.');

const effectiveVariablesList = computed(() => {
  if (props.variablesList && props.variablesList.length > 0) {
    return props.variablesList;
  }
  return Object.entries(props.params).map(([k, v]) => ({
    name: k,
    symbol: k,
    value: v,
    unit: '—'
  }));
});

function formatVal(v: number, decimals: number): string {
  return formatScientificValue(v, {
    decimals,
    usePersianDigits: store.usePersianDigits
  });
}

const finalResultsRows = computed(() => {
  if (props.resultsRows && props.resultsRows.length > 0) {
    return props.resultsRows;
  }
  const r = props.results;
  if (r && 'simulatedRange' in r) {
    return [
      {
        name: 'برد پرتابه (Range)',
        simulated: `${formatVal(r.simulatedRange, 2)} m`,
        theoretical: `${formatVal(r.theoreticalRange, 2)} m`,
        error: `${formatVal(r.rangeError, 2)} %`
      },
      {
        name: 'اوج ارتفاع (Max Height)',
        simulated: `${formatVal(r.simulatedMaxHeight, 2)} m`,
        theoretical: `${formatVal(r.theoreticalMaxHeight, 2)} m`,
        error: `${formatVal(r.heightError, 2)} %`
      },
      {
        name: 'زمان پرواز (Flight Time)',
        simulated: `${formatVal(r.simulatedFlightTime, 2)} s`,
        theoretical: `${formatVal(r.theoreticalFlightTime, 2)} s`,
        error: `${formatVal(r.timeError, 2)} %`
      }
    ];
  }
  if (r) {
    return Object.entries(r).map(([k, v]) => ({
      name: k,
      simulated: typeof v === 'number' ? formatVal(v, 2) : String(v),
      theoretical: '—',
      error: '—'
    }));
  }
  return [];
});

function captureSceneSnapshot() {
  if (props.sceneCanvas) {
    try {
      graphSnapshot.value = props.sceneCanvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Canvas capture error:', e);
    }
  }
}

async function downloadPdf() {
  if (!reportElement.value) return;
  captureSceneSnapshot();
  isGenerating.value = true;

  try {
    const canvas = await html2canvas(reportElement.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const totalPdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = totalPdfHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;

    // Remaining pages
    while (heightLeft > 0) {
      position = heightLeft - totalPdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Lab-Report-Projectile-${Date.now()}.pdf`);
    store.showToast('گزارش PDF با موفقیت دانلود شد.', 'success');
  } catch (error) {
    console.error('PDF generation failed:', error);
    store.showToast('خطا در تولید PDF.', 'danger');
  } finally {
    isGenerating.value = false;
  }
}

function printPdf() {
  captureSceneSnapshot();
  window.print();
}

function exportJson() {
  const data = {
    title: props.title,
    date: new Date().toISOString(),
    mode: props.mode,
    params: props.params,
    results: props.results,
    notes: props.notes
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projectile-experiment-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  store.showToast('فایل JSON ذخیره شد.', 'success');
}

function exportPng() {
  if (!props.sceneCanvas) {
    store.showToast('بوم آزمایش در دسترس نیست.', 'warning');
    return;
  }
  const url = props.sceneCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `projectile-scene-${Date.now()}.png`;
  a.click();
  store.showToast('تصویر با موفقیت ذخیره شد.', 'success');
}

function copyShareLink() {
  const payload = {
    m: props.mode,
    p: props.params
  };
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
  const url = `${window.location.origin}${window.location.pathname}#/experiment/physics/motion/projectile?data=${compressed}`;

  navigator.clipboard.writeText(url).then(() => {
    store.showToast('پیوند اشتراک در کلیپ‌بورد کپی شد.', 'success');
  });
}
</script>

<style scoped>
.export-report-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.buttons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.btn-action {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--surface-hover);
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.85rem;
  transition: all var(--transition-fast);
}

.btn-action:hover:not(:disabled) {
  border-color: var(--border-focus);
  background: var(--surface-active);
}

.btn-action.primary {
  background: var(--color-physics);
  color: var(--text-inverse);
  border-color: var(--color-physics);
}

/* Off-screen / Print Report Template */
.print-container {
  position: absolute;
  top: -99999px;
  left: -99999px;
  width: 210mm;
}

.a4-report {
  width: 210mm;
  padding: 20mm;
  background: #ffffff;
  color: #111827;
  font-family: 'Vazirmatn', sans-serif;
  box-sizing: border-box;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.report-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e3a8a;
  margin-bottom: 4px;
}

.report-meta {
  font-size: 0.85rem;
  color: #4b5563;
}

.header-badge {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.report-section {
  margin-bottom: 18px;
}

.report-section h2 {
  font-size: 1.05rem;
  color: #1e40af;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 4px;
  margin-bottom: 8px;
}

.report-section p {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #374151;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  margin-top: 6px;
}

.report-table th, .report-table td {
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  text-align: right;
}

.report-table th {
  background: #f3f4f6;
  color: #1f2937;
  font-weight: 600;
}

.report-graph-img-wrap {
  text-align: center;
  margin-top: 8px;
}

.report-graph-img {
  max-width: 100%;
  height: 220px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.report-footer {
  margin-top: 30px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

/* Native Print Styles via window.print() */
@media print {
  body * {
    visibility: hidden;
  }
  .print-container, .print-container * {
    visibility: visible;
  }
  .print-container {
    position: static;
    left: auto;
    top: auto;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .a4-report {
    width: 100%;
    padding: 0;
  }
}
</style>
