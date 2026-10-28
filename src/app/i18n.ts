import { createI18n } from 'vue-i18n';
import projectileFa from '../experiments/physics/motion/projectile/i18n/fa.json';
import projectileEn from '../experiments/physics/motion/projectile/i18n/en.json';
import kinematicsFa from '../experiments/physics/motion/1d-2d-kinematics/i18n/fa.json';
import kinematicsEn from '../experiments/physics/motion/1d-2d-kinematics/i18n/en.json';
import inclinedPlaneFa from '../experiments/physics/motion/newton-inclined-plane/i18n/fa.json';
import inclinedPlaneEn from '../experiments/physics/motion/newton-inclined-plane/i18n/en.json';
import pulleysLeversFa from '../experiments/physics/motion/pulleys-levers/i18n/fa.json';
import pulleysLeversEn from '../experiments/physics/motion/pulleys-levers/i18n/en.json';

const globalMessages = {
  fa: {
    projectile: projectileFa,
    kinematics: kinematicsFa,
    inclinedPlane: inclinedPlaneFa,
    pulleysLevers: pulleysLeversFa,
    app: {
      title: 'آزمایشگاه مجازی علوم',
      subtitle: 'شبیه‌سازی‌های علمی تعاملی، دقیق و بدون نیاز به اینترنت',
      searchPlaceholder: 'جستجوی آزمایش، موضوع یا متغیر...',
      allSubjects: 'همه رشته‌ها',
      allGrades: 'همه مقاطع',
      offlineReady: 'آزمایشگاه کاملاً آفلاین آماده است.',
      updateAvailable: 'نسخه جدید در دسترس است. برای به‌روزرسانی کلیک کنید.',
      reload: 'به‌روزرسانی',
      dismiss: 'بستن',
      installPwa: 'نصب برنامه روی دستگاه',
      installed: 'برنامه با موفقیت نصب شد.',
      nav: {
        home: 'خانه و آزمایش‌ها',
        favorites: 'علاقه‌مندی‌ها',
        history: 'تاریخچه آزمایش‌ها',
        settings: 'تنظیمات',
        projectile: 'پرتابه'
      }
    },
    subjects: {
      physics: 'فیزیک',
      chemistry: 'شیمی',
      biology: 'زیست‌شناسی',
      earth: 'زمین و فضا',
      math: 'ریاضی و آمار',
      engineering: 'مهندسی و مدار',
      cs: 'علوم کامپیوتر',
      environment: 'محیط زیست',
      psychology: 'روانشناسی',
      astronomy: 'نجوم و اخترشناسی',
      economics: 'اقتصاد و داده'
    },
    grades: {
      'middle-school': 'متوسطه اول',
      'high-school': 'متوسطه دوم',
      university: 'دانشگاه'
    },
    difficulty: {
      easy: 'مقدماتی',
      medium: 'متوسط',
      advanced: 'پیشرفته'
    },
    common: {
      play: 'اجرا',
      pause: 'توقف',
      step: 'یک گام به جلو',
      reset: 'تنظیم مجدد',
      speed: 'سرعت شبیه‌سازی',
      mode: 'حالت فیزیکی',
      ideal: 'ایده‌آل (بدون مقاومت)',
      real: 'واقعی (با اصطکاک و نویز)',
      saveSlot: 'ذخیره وضعیت',
      loadSlot: 'بازیابی وضعیت',
      export: 'خروجی داده',
      notes: 'یادداشت‌های آزمایشگاهی',
      theory: 'مبانی نظری و فرمول‌ها',
      graph: 'نمودار زنده',
      table: 'جدول داده‌ها',
      guided: 'راهنمای گام‌به‌گام',
      tools: 'ابزارهای اندازه‌گیری',
      presets: 'پیش‌تنظیم‌ها',
      controls: 'کنترل متغیرها',
      close: 'بستن',
      confirm: 'تایید',
      cancel: 'انصراف',
      downloadPdf: 'دانلود گزارش PDF',
      printPdf: 'چاپ / ذخیره به صورت PDF',
      exportCsv: 'خروجی اکسل (CSV)',
      exportJson: 'خروجی داده خام (JSON)',
      copyShareLink: 'کپی پیوند اشتراک',
      shareCopied: 'پیوند آزمایش در حافظه موقت کپی شد.',
      fullscreen: 'تمام‌صفحه',
      ruler: 'خط‌کش مدرج',
      stopwatch: 'کرونومتر دیجیتال',
      start: 'شروع',
      stop: 'توقف',
      resetZero: 'تنظیم صفر',
      rotateCcw: 'چرخش پادساعتگرد',
      rotateCw: 'چرخش ساعتگرد',
      slotNumber: 'جایگاه {num}',
      empty: 'خالی',
      save: 'ذخیره',
      load: 'بازیابی',
      slotSaved: 'وضعیت در جایگاه {num} ذخیره شد.',
      slotLoaded: 'وضعیت از جایگاه {num} بازیابی شد.',
      calculatedValue: 'مقدار محاسبه‌شده:',
      stepNum: 'گام {current} از {total}',
      hint: 'راهنمایی:',
      prevStep: 'گام قبلی',
      nextStep: 'گام بعدی',
      finishGuide: 'پایان راهنما',
      dataPoints: '{count} نقطه',
      noDataRecorded: 'داده‌ای ثبت نشده است. شبیه‌سازی را اجرا کنید.',
      chartYx: 'مسیر (y - x)',
      chartYt: 'ارتفاع - زمان (y - t)',
      chartXt: 'موقعیت افقی - زمان (x - t)',
      chartVt: 'سرعت کل - زمان (v - t)',
      vectors: 'بردارها',
      trail: 'رد مسیر',
      overview: 'دید کلی',
      resetCamera: 'تنظیم مجدد دوربین'
    },
    home: {
      activeLabs: 'آزمایش‌های فعال و آماده',
      labsCount: '{count} آزمایش',
      readyBadge: 'آماده آزمایش ✓',
      roadmapTitle: 'نقشه راه آزمایش‌ها (در دست توسعه)',
      roadmapCount: '۶۰+ آزمایش در ۱۱ رشته',
      plannedStatus: 'برنامه‌ریزی‌شده'
    },
    settings: {
      title: 'تنظیمات آزمایشگاه',
      language: 'زبان رابط کاربری',
      theme: 'پوسته ظاهری',
      themeDark: 'تاریک (آزمایشگاهی)',
      themeLight: 'روشن',
      persianDigits: 'نمایش اعداد به فارسی',
      persianDigitsDesc: 'تبدیل ارقام در متن‌ها و کنترل‌ها به ارقام فارسی',
      storage: 'فضای ذخیره‌سازی آفلاین',
      storagePersisted: 'فضای ذخیره‌سازی پایدار فعال است',
      storageStatusDesc: 'وضعیت فضای ذخیره‌سازی داده‌های آزمایشگاه در مرورگر:',
      storagePersistedStrong: 'پایدار و محافظت‌شده (Persisted)',
      storageDefaultStrong: 'معمولی (قابل پاکسازی خودکار توسط مرورگر)',
      requestPersistence: 'درخواست ماندگاری دائمی داده‌ها',
      exportBackup: 'پشتیبان‌گیری کامل (JSON)',
      importBackup: 'بازیابی فایل پشتیبان',
      clearAll: 'پاکسازی کلیه داده‌های محلی',
      backupExported: 'فایل پشتیبان با موفقیت صادر شد.',
      backupFailed: 'خطا در پشتیبان‌گیری.',
      backupRestored: 'بازیابی پایگاه داده با موفقیت انجام شد.',
      backupRestoreError: 'خطا در بازیابی: {err}',
      lightMode: 'حالت روشن',
      darkMode: 'حالت تاریک'
    },
    experiments: {
      projectile: {
        title: 'حرکت پرتابه و دینامیک پرتاب',
        description: 'بررسی شبیه‌سازی حرکت دوبعدی پرتابه تحت گرانش‌های مختلف، مقاومت آیرودینامیکی هوا و باد'
      },
      kinematics: {
        title: 'حرکت یک‌بعدی و دوبعدی',
        description: 'بررسی سینماتیک حرکت بر خط راست، شتاب ثابت، معادلات مستقل از زمان توریسلی و مسیر دوبعدی'
      },
      inclinedPlane: {
        title: 'قوانین نیوتن و اصطکاک روی سطح شیب‌دار',
        description: 'بررسی تجزیه نیروها، اصطکاک ایستایی و جنبشی و شتاب حرکت روی سطح شیب‌دار'
      },
      pulleysLevers: {
        title: 'قرقره‌ها، اهرم‌ها و ماشین‌های ساده',
        description: 'بررسی ماشین آتوود، سیستم قرقره‌های مرکب، مزیت مکانیکی، بازده و تعادل اهرم‌ها'
      }
    },
    experiment: {
      loading: 'در حال بارگذاری شبیه‌سازی آزمایشگاه...',
      notFound: 'آزمایش مورد نظر یافت نشد',
      notFoundDesc: 'آزمایش با شناسه "{id}" هنوز پیاده‌سازی نشده یا موجود نیست.',
      backToList: 'بازگشت به فهرست آزمایش‌ها',
      loadError: 'خطا در بارگذاری مؤلفه‌های آزمایش.'
    }
  },
  en: {
    projectile: projectileEn,
    kinematics: kinematicsEn,
    inclinedPlane: inclinedPlaneEn,
    pulleysLevers: pulleysLeversEn,
    app: {
      title: 'Virtual Science Lab',
      subtitle: 'Interactive, accurate, and offline-first scientific simulations',
      searchPlaceholder: 'Search experiments, topics, or variables...',
      allSubjects: 'All Subjects',
      allGrades: 'All Grades',
      offlineReady: 'Lab is ready for full offline use.',
      updateAvailable: 'New version available. Click to reload.',
      reload: 'Update',
      dismiss: 'Dismiss',
      installPwa: 'Install App on Device',
      installed: 'Application installed successfully.',
      nav: {
        home: 'Home & Labs',
        favorites: 'Favorites',
        history: 'Run History',
        settings: 'Settings',
        projectile: 'Projectile'
      }
    },
    subjects: {
      physics: 'Physics',
      chemistry: 'Chemistry',
      biology: 'Biology',
      earth: 'Earth & Space',
      math: 'Math & Statistics',
      engineering: 'Engineering & Circuits',
      cs: 'Computer Science',
      environment: 'Environment',
      psychology: 'Psychology',
      astronomy: 'Astronomy',
      economics: 'Economics'
    },
    grades: {
      'middle-school': 'Middle School',
      'high-school': 'High School',
      university: 'University'
    },
    difficulty: {
      easy: 'Beginner',
      medium: 'Intermediate',
      advanced: 'Advanced'
    },
    common: {
      play: 'Play',
      pause: 'Pause',
      step: 'Step Forward',
      reset: 'Reset',
      speed: 'Simulation Speed',
      mode: 'Physics Mode',
      ideal: 'Ideal (Zero Drag)',
      real: 'Real (Drag & Noise)',
      saveSlot: 'Save State',
      loadSlot: 'Load State',
      export: 'Export Data',
      notes: 'Lab Notes',
      theory: 'Theory & Formulas',
      graph: 'Live Graph',
      table: 'Data Table',
      guided: 'Guided Lab Steps',
      tools: 'Measurement Tools',
      presets: 'Presets',
      controls: 'Variable Controls',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      downloadPdf: 'Download PDF Report',
      printPdf: 'Print / Save as PDF',
      exportCsv: 'Export Excel (CSV)',
      exportJson: 'Export Raw Data (JSON)',
      copyShareLink: 'Copy Share Link',
      shareCopied: 'Experiment share link copied to clipboard.',
      fullscreen: 'Fullscreen',
      ruler: 'Lab Ruler',
      stopwatch: 'Digital Stopwatch',
      start: 'Start',
      stop: 'Stop',
      resetZero: 'Zero',
      rotateCcw: 'Rotate Counter-Clockwise',
      rotateCw: 'Rotate Clockwise',
      slotNumber: 'Slot {num}',
      empty: 'Empty',
      save: 'Save',
      load: 'Load',
      slotSaved: 'State saved to slot {num}.',
      slotLoaded: 'State restored from slot {num}.',
      calculatedValue: 'Calculated Value:',
      stepNum: 'Step {current} of {total}',
      hint: 'Hint:',
      prevStep: 'Previous Step',
      nextStep: 'Next Step',
      finishGuide: 'Finish Guide',
      dataPoints: '{count} points',
      noDataRecorded: 'No data recorded yet. Run the simulation.',
      chartYx: 'Trajectory (y - x)',
      chartYt: 'Height - Time (y - t)',
      chartXt: 'Range - Time (x - t)',
      chartVt: 'Velocity - Time (v - t)',
      vectors: 'Vectors',
      trail: 'Trail',
      overview: 'Overview',
      resetCamera: 'Reset Camera'
    },
    home: {
      activeLabs: 'Active & Ready Experiments',
      labsCount: '{count} experiments',
      readyBadge: 'Ready to Run ✓',
      roadmapTitle: 'Simulations Roadmap (In Progress)',
      roadmapCount: '60+ Labs across 11 Subjects',
      plannedStatus: 'Planned'
    },
    settings: {
      title: 'Lab Settings',
      language: 'Interface Language',
      theme: 'Theme',
      themeDark: 'Dark (Laboratory)',
      themeLight: 'Light',
      persianDigits: 'Persian Digits',
      persianDigitsDesc: 'Format numerals using Persian digits',
      storage: 'Offline Storage',
      storagePersisted: 'Persistent storage is active',
      storageStatusDesc: 'Browser offline data persistence status:',
      storagePersistedStrong: 'Persistent & Protected (Persisted)',
      storageDefaultStrong: 'Standard (subject to browser eviction)',
      requestPersistence: 'Request Persistent Quota',
      exportBackup: 'Full Backup (JSON)',
      importBackup: 'Restore Backup File',
      clearAll: 'Clear All Local Data',
      backupExported: 'Backup file exported successfully.',
      backupFailed: 'Backup export failed.',
      backupRestored: 'Database restored successfully.',
      backupRestoreError: 'Restore error: {err}',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode'
    },
    experiments: {
      projectile: {
        title: 'Projectile Motion & Ballistics',
        description: 'Explore 2D projectile kinematics under various gravities, aerodynamic drag, and wind'
      },
      kinematics: {
        title: '1D & 2D Kinematics',
        description: 'Investigate rectilinear motion, constant acceleration, Torricelli time-independent relation, and 2D paths'
      },
      inclinedPlane: {
        title: "Newton's Laws & Inclined Plane",
        description: 'Explore force resolution, static & kinetic friction, and sliding acceleration on an incline'
      },
      pulleysLevers: {
        title: 'Pulleys, Levers & Simple Machines',
        description: 'Explore the Atwood machine, block and tackle pulleys, mechanical advantage, efficiency, and lever equilibrium'
      }
    },
    experiment: {
      loading: 'Loading science simulation...',
      notFound: 'Experiment not found',
      notFoundDesc: 'Experiment with ID "{id}" is not yet built or available.',
      backToList: 'Back to Experiment Catalog',
      loadError: 'Error loading experiment components.'
    }
  }
};

export const i18n = createI18n({
  legacy: false,
  locale: 'fa',
  fallbackLocale: 'en',
  messages: globalMessages
});

export function setAppLanguage(lang: 'fa' | 'en'): void {
  // @ts-ignore
  i18n.global.locale.value = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
}

export function registerExperimentMessages(
  locale: 'fa' | 'en',
  experimentNamespace: string,
  messages: Record<string, any>
): void {
  // @ts-ignore
  i18n.global.mergeLocaleMessage(locale, {
    [experimentNamespace]: messages
  });
}
