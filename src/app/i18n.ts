import { createI18n } from 'vue-i18n';
import projectileFa from '../experiments/physics/motion/projectile/i18n/fa.json';
import projectileEn from '../experiments/physics/motion/projectile/i18n/en.json';
import kinematicsFa from '../experiments/physics/motion/1d-2d-kinematics/i18n/fa.json';
import kinematicsEn from '../experiments/physics/motion/1d-2d-kinematics/i18n/en.json';
import inclinedPlaneFa from '../experiments/physics/motion/newton-inclined-plane/i18n/fa.json';
import inclinedPlaneEn from '../experiments/physics/motion/newton-inclined-plane/i18n/en.json';
import pulleysLeversFa from '../experiments/physics/motion/pulleys-levers/i18n/fa.json';
import pulleysLeversEn from '../experiments/physics/motion/pulleys-levers/i18n/en.json';
import circularMotionFa from '../experiments/physics/motion/circular-motion/i18n/fa.json';
import circularMotionEn from '../experiments/physics/motion/circular-motion/i18n/en.json';
import collisionsFa from '../experiments/physics/motion/collisions-momentum/i18n/fa.json';
import collisionsEn from '../experiments/physics/motion/collisions-momentum/i18n/en.json';
import torqueFa from '../experiments/physics/motion/torque-equilibrium/i18n/fa.json';
import torqueEn from '../experiments/physics/motion/torque-equilibrium/i18n/en.json';
import pendulumsFa from '../experiments/physics/motion/pendulums/i18n/fa.json';
import pendulumsEn from '../experiments/physics/motion/pendulums/i18n/en.json';
import springFa from '../experiments/physics/motion/spring-shm/i18n/fa.json';
import springEn from '../experiments/physics/motion/spring-shm/i18n/en.json';
import orbitalFa from '../experiments/physics/motion/orbital-gravity/i18n/fa.json';
import orbitalEn from '../experiments/physics/motion/orbital-gravity/i18n/en.json';
import rotationalFa from '../experiments/physics/motion/rotational-dynamics/i18n/fa.json';
import rotationalEn from '../experiments/physics/motion/rotational-dynamics/i18n/en.json';
import skateParkFa from '../experiments/physics/energy/skate-park/i18n/fa.json';
import skateParkEn from '../experiments/physics/energy/skate-park/i18n/en.json';
import workPowerFa from '../experiments/physics/energy/work-power/i18n/fa.json';
import workPowerEn from '../experiments/physics/energy/work-power/i18n/en.json';
import pressureDensityFa from '../experiments/physics/fluids/pressure-density/i18n/fa.json';
import pressureDensityEn from '../experiments/physics/fluids/pressure-density/i18n/en.json';
import buoyancyFa from '../experiments/physics/fluids/buoyancy-archimedes/i18n/fa.json';
import buoyancyEn from '../experiments/physics/fluids/buoyancy-archimedes/i18n/en.json';

const globalMessages = {
  fa: {
    projectile: projectileFa,
    kinematics: kinematicsFa,
    inclinedPlane: inclinedPlaneFa,
    pulleysLevers: pulleysLeversFa,
    circularMotion: circularMotionFa,
    collisionsMomentum: collisionsFa,
    torqueEquilibrium: torqueFa,
    pendulums: pendulumsFa,
    springShm: springFa,
    orbitalGravity: orbitalFa,
    rotationalDynamics: rotationalFa,
    skatePark: skateParkFa,
    workPower: workPowerFa,
    pressureDensity: pressureDensityFa,
    buoyancy: buoyancyFa,
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
      time: 'زمان',
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
      },
      circularMotion: {
        title: 'حرکت دایره‌ای و نیروی مرکزگرا',
        description: 'بررسی شتاب مرکزگرا، کشش ریسمان، بسامد و دوره دوران و پدیده پاره‌شدن نخ'
      },
      collisionsMomentum: {
        title: 'برخوردها و پایستگی تکانه',
        description: 'بررسی برخورد کشسان و ناکشسان، ضریب بازگشت، پایستگی تکانه خطی و تغییرات انرژی جنبشی'
      },
      torqueEquilibrium: {
        title: 'گشتاور و تعادل ایستا (الاکلنگ)',
        description: 'بررسی بازوی محرک و مقاوم، قانون گشتاورها، تعادل چرخشی اهرم و الاکلنگ و مرکز ثقل تیرک'
      },
      pendulums: {
        title: 'آونگ ساده و آونگ دوگانه (آشوب)',
        description: 'شبیه‌سازی نوسان هماهنگ ساده، وابستگی دوره به دامنه، پایستگی انرژی و دینامیک آشوبناک آونگ دوگانه'
      },
      springShm: {
        title: 'فنر و نوسان هماهنگ ساده (رزونانس)',
        description: 'بررسی قانون هوک، نوسانگر جرم و فنر، دوره‌های نوسان طبیعی، میرایی و پدیده تشدید'
      },
      orbitalGravity: {
        title: 'گرانش و مدارهای سیاره‌ای (کپلر)',
        description: 'بررسی قوانین کپلر، سرعت مداری ویس-ویوا، خروج از مرکز مدار، پایداری مدارهای LEO/GEO و افت مداری'
      },
      rotationalDynamics: {
        title: 'دینامیک دوران و ژیروسکوپ',
        description: 'بررسی گشتاور لختی اشکال مختلف، رابطه گشتاور و شتاب زاویه‌ای، انرژی جنبشی دورانی و اصطکاک یاتاقان'
      },
      skatePark: {
        title: 'پایستگی انرژی (پیست اسکیت)',
        description: 'بررسی پایستگی انرژی مکانیکی، تبدیل انرژی پتانسیل گرانشی به جنبشی، اتلاف اصطکاکی گرمایی و پیست‌های U و موجی'
      },
      workPower: {
        title: 'کار و توان مکانیکی',
        description: 'بررسی قضیه کار و انرژی، انتگرال کار نیروی متغیر، توان لحظه‌ای و میانگین، و راندمان الکترومکانیکی موتور'
      },
      pressureDensity: {
        title: 'فشار شاره‌ها و چگالی',
        description: 'بررسی فشار هیدرواستاتیک در عمق، مقایسه فشار مطلق و پیمانه‌ای، مانومتر U شکل و تأثیر انبساط حرارتی بر چگالی'
      },
      buoyancy: {
        title: 'شناوری و اصل ارشمیدس',
        description: 'بررسی نیروی شناوری ارشمیدس، کسر حجم فرورفته در تعادل شناوری، ترازوی فنری و وزن ظاهری، و استوانه شاره جابه‌جا شده'
      },
      pascalBernoulli: {
        title: 'اصل پاسکال و معادله برنولی',
        description: 'بررسی انتقال همه‌جانبه فشار در بالابر هیدرولیکی (اصل پاسکال) و رابطه معکوس سرعت و فشار در لوله ونتوری (معادله برنولی)'
      },
      viscosityPipe: {
        title: 'گرانروی (ویسکوزیته) و جریان لوله‌ها',
        description: 'بررسی قانون پوازوی در جریان لامینار، پروفیل سهموی سرعت، آزمایش تزریق جوهر رینولدز و گذار از جریان آرام به متلاطم'
      },
      heatTransfer: {
        title: 'انتقال حرارت: رسانش، همرفت، تابش',
        description: 'بررسی قانون فوریه در جامدات، همرفت طبیعی و ستون‌های شناوری نیوتونی، قانون تابش استفان-بولتزمن و قانون وین'
      },
      calorimetry: {
        title: 'گرماسنجی و ظرفیت گرمایی ویژه',
        description: 'بررسی قانون تعادل گرمایی، اندازه‌گیری ظرفیت گرمایی ویژه فلزات، ارزش آب گرماسنج و گذار فاز ذوب یخ'
      },
      gasLaws: {
        title: 'قوانین گازها و سینتیک مولکولی',
        description: 'بررسی معادله گاز آرمانی، قوانین بویل، شارل، گیلوساک، توزیع سرعت ماکسول-بولتزمن و گازهای واقعی وان‌دروالس'
      },
      thermalExpansion: {
        title: 'انبساط گرمایی اجسام',
        description: 'بررسی انبساط طولی میله‌ها با میکرومتر ساعتی، خمش تیغه دوفلزه در کلید ترموستات و رفتار ناهنجار انبساط آب در ۴ درجه'
      },
      heatEngines: {
        title: 'چرخه‌های ترمودینامیکی و موتورهای گرمایی',
        description: 'بررسی جامع چرخه‌های کارنو، اتو، دیزل و استرلینگ، دیاگرام‌های فشار-حجم (PV) و دما-آنتروپی (TS)، محاسبه کار خالص و راندمان حرارتی'
      },
      waveInterference: {
        title: 'امواج طولی و عرضی و تداخل',
        description: 'بررسی اصل برهم‌نهی امواج، تداخل دو منبعی در تشت موج، خطوط گرهی و پادگرهی، و امواج طولی و عرضی'
      },
      standingWaves: {
        title: 'امواج ایستاده در سیم و لوله صوتی',
        description: 'بررسی امواج ساکن در تار مرتعش با دو سر ثابت، لوله‌های صوتی باز و بسته، هماهنگ‌ها، گره‌ها و شکم‌ها، و لوله کوندت'
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
    circularMotion: circularMotionEn,
    collisionsMomentum: collisionsEn,
    torqueEquilibrium: torqueEn,
    pendulums: pendulumsEn,
    springShm: springEn,
    orbitalGravity: orbitalEn,
    rotationalDynamics: rotationalEn,
    skatePark: skateParkEn,
    workPower: workPowerEn,
    pressureDensity: pressureDensityEn,
    buoyancy: buoyancyEn,
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
      time: 'Time',
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
      },
      circularMotion: {
        title: 'Circular Motion & Centripetal Force',
        description: 'Investigate centripetal acceleration, string tension, orbital period, frequency, and tether snapping'
      },
      collisionsMomentum: {
        title: 'Collisions & Linear Momentum',
        description: 'Investigate 1D elastic and inelastic collisions on an air track, coefficient of restitution, and momentum conservation'
      },
      torqueEquilibrium: {
        title: 'Torque & Static Equilibrium',
        description: 'Investigate lever arms, principle of moments, rotational equilibrium of a seesaw, and center of gravity'
      },
      pendulums: {
        title: 'Simple & Double Pendulum (Chaos)',
        description: 'Simulate simple harmonic oscillation, amplitude-period dependence, energy conservation, and chaotic double pendulum dynamics'
      },
      springShm: {
        title: 'Spring & Simple Harmonic Motion (Resonance)',
        description: 'Investigate Hooke\'s law, mass-spring harmonic oscillation, natural frequencies, damping regimes, and mechanical resonance'
      },
      orbitalGravity: {
        title: 'Gravity & Planetary Orbits (Kepler)',
        description: 'Simulate Kepler\'s laws, Vis-Viva orbital speed, orbital eccentricity, LEO/GEO stability, and atmospheric decay'
      },
      rotationalDynamics: {
        title: 'Rigid Body Rotation & Gyroscope',
        description: 'Simulate moments of inertia for standard shapes, torque vs angular acceleration, rotational kinetic energy, and bearing friction'
      },
      skatePark: {
        title: 'Conservation of Energy (Skate Park)',
        description: 'Investigate conservation of mechanical energy, potential to kinetic energy conversion, thermal friction dissipation, and curved tracks'
      },
      workPower: {
        title: 'Work & Power',
        description: 'Investigate the work-energy theorem, variable force work integrals, instantaneous vs average power, and motor mechanical efficiency'
      },
      pressureDensity: {
        title: 'Fluid Pressure & Density',
        description: 'Investigate hydrostatic pressure with depth, gauge vs absolute pressure, U-tube manometers, and thermal expansion of fluids'
      },
      buoyancy: {
        title: "Buoyancy & Archimedes' Principle",
        description: "Investigate Archimedes' buoyant force, equilibrium submerged volume fraction, spring balance apparent weight, and displaced liquid volume"
      },
      pascalBernoulli: {
        title: "Pascal's Principle & Bernoulli's Equation",
        description: "Explore isotropic pressure transmission in a hydraulic lift (Pascal) and inverse pressure-velocity relationship in a Venturi tube (Bernoulli)"
      },
      viscosityPipe: {
        title: "Viscosity & Pipe Flow",
        description: "Investigate Poiseuille's law in laminar flow, parabolic velocity profile, Reynolds dye streak experiment, and transition to turbulence"
      },
      heatTransfer: {
        title: "Heat Transfer: Conduction, Convection, Radiation",
        description: "Investigate Fourier conduction in solids, Newton convective plumes, Stefan-Boltzmann radiation, and Wien displacement law"
      },
      calorimetry: {
        title: "Calorimetry & Specific Heat",
        description: "Investigate thermal equilibrium, specific heat capacity of metals, calorimeter water equivalent, and latent heat of fusion"
      },
      gasLaws: {
        title: "Gas Laws & Molecular Kinetics",
        description: "Investigate ideal gas equation, Boyle, Charles, Gay-Lussac laws, Maxwell-Boltzmann velocity distribution, and Van der Waals real gases"
      },
      thermalExpansion: {
        title: "Thermal Expansion",
        description: "Investigate linear rod expansion with micrometer dial, bimetallic strip thermostat deflection, and water 4°C density anomaly"
      },
      heatEngines: {
        title: "Thermodynamic Heat Cycles & Heat Engines",
        description: "Comprehensive simulation of Carnot, Otto, Diesel, and Stirling heat cycles, featuring live PV and TS indicator diagrams, net work, and thermal efficiency"
      },
      waveInterference: {
        title: "Wave Superposition & Interference",
        description: "Explore the principle of linear superposition, 2D two-source ripple tank interference fringes, nodal lines, and 1D transverse/longitudinal waves"
      },
      standingWaves: {
        title: "Standing Waves on Strings & Air Columns",
        description: "Explore standing waves on fixed tensioned strings, open and closed acoustic pipes, harmonics, nodes and antinodes, and Kundt dust patterns"
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
