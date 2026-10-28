import {precacheAndRoute as workbox_precaching_precacheAndRoute} from 'D:/Local/experiment/node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/precacheAndRoute.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from 'D:/Local/experiment/node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs';
import {registerRoute as workbox_routing_registerRoute} from 'D:/Local/experiment/node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/registerRoute.mjs';
import {NavigationRoute as workbox_routing_NavigationRoute} from 'D:/Local/experiment/node_modules/.pnpm/workbox-routing@7.4.1/node_modules/workbox-routing/NavigationRoute.mjs';
import {createHandlerBoundToURL as workbox_precaching_createHandlerBoundToURL} from 'D:/Local/experiment/node_modules/.pnpm/workbox-precaching@7.4.1/node_modules/workbox-precaching/createHandlerBoundToURL.mjs';/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */




self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
workbox_precaching_precacheAndRoute([
  {
    "url": "index.html",
    "revision": "b999485aef8829c1371caaeb3c81f16b"
  },
  {
    "url": "icons/icon-96.png",
    "revision": "7804358d076efd4477d9c69386673c1d"
  },
  {
    "url": "icons/icon-72.png",
    "revision": "db24ede1b548217784308456095422a5"
  },
  {
    "url": "icons/icon-512.png",
    "revision": "4e338f893193734ae580b2094a04570f"
  },
  {
    "url": "icons/icon-48.png",
    "revision": "cccfd21c54a8486703809fd3299462a5"
  },
  {
    "url": "icons/icon-192.png",
    "revision": "18491bd029e9de1184f53c9c11a13721"
  },
  {
    "url": "icons/icon-144.png",
    "revision": "2ab2b0b7f7cf6f380510008476c4bc3e"
  },
  {
    "url": "fonts/Vazirmatn-font-face.css",
    "revision": "fd2e082050ac6423093070804dcaff0d"
  },
  {
    "url": "fonts/webfonts/Vazirmatn[wght].woff2",
    "revision": "f6d31671339db80142ceaf6382570e79"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Thin.woff2",
    "revision": "99086e7ee7b05991f5b02b7647952c4b"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-SemiBold.woff2",
    "revision": "9260c192787251165aacac4e12c997ad"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Regular.woff2",
    "revision": "cdc140628f111dc1f6185775f968e379"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Medium.woff2",
    "revision": "dd2193b32cbe791734c97e4e167816bf"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Light.woff2",
    "revision": "6458eed8cf924e973b43dac780a737f8"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-ExtraLight.woff2",
    "revision": "3d8ceebeffb457d5cb97b08977e23a3f"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-ExtraBold.woff2",
    "revision": "a0f99309cd35ee8634cac7d7f6d9f9bc"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Bold.woff2",
    "revision": "7958481fe611c2574940c172068921bb"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Black.woff2",
    "revision": "6cfb460b4140c8544af1cee2e23359a2"
  },
  {
    "url": "assets/workbox-window.prod.es5-BqEJf4Xk.js",
    "revision": null
  },
  {
    "url": "assets/purify.es-BwoZCkIS.js",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Typewriter-Regular-CO6r4hn1.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Size4-Regular-Dl5lxZxV.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Size2-Regular-Dy4dx90m.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Size1-Regular-mCD8mA8B.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Script-Regular-D3wIWfF6.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_SansSerif-Regular-DDBCnlJ7.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_SansSerif-Italic-C3H0VqGB.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_SansSerif-Bold-D1sUS0GD.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Math-Italic-t53AETM-.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Math-BoldItalic-CZnvNsCZ.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Main-Regular-B22Nviop.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Main-Italic-NWA7e6Wa.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Main-BoldItalic-DxDJ3AOS.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Main-Bold-Cx986IdX.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Fraktur-Regular-CTYiF6lA.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Fraktur-Bold-CL6g_b3V.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Caligraphic-Regular-Di6jR-x-.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_Caligraphic-Bold-Dq_IR9rO.woff2",
    "revision": null
  },
  {
    "url": "assets/KaTeX_AMS-Regular-BQhdFMY1.woff2",
    "revision": null
  },
  {
    "url": "assets/index.es-vq_Gmo5V.js",
    "revision": null
  },
  {
    "url": "assets/index-woB_meNT.js",
    "revision": null
  },
  {
    "url": "assets/index-B_iroxXP.css",
    "revision": null
  },
  {
    "url": "assets/html2canvas.esm-CBrSDip1.js",
    "revision": null
  },
  {
    "url": "assets/fa-CtQ3nbXp.js",
    "revision": null
  },
  {
    "url": "assets/Experiment-DuQLATYF.css",
    "revision": null
  },
  {
    "url": "assets/Experiment-ANWddZs5.js",
    "revision": null
  },
  {
    "url": "assets/en-DbFgiATb.js",
    "revision": null
  },
  {
    "url": "assets/config-BLvLBmuy.js",
    "revision": null
  },
  {
    "url": "fonts/Vazirmatn-font-face.css",
    "revision": "fd2e082050ac6423093070804dcaff0d"
  },
  {
    "url": "icons/icon-144.png",
    "revision": "2ab2b0b7f7cf6f380510008476c4bc3e"
  },
  {
    "url": "icons/icon-192.png",
    "revision": "18491bd029e9de1184f53c9c11a13721"
  },
  {
    "url": "icons/icon-48.png",
    "revision": "cccfd21c54a8486703809fd3299462a5"
  },
  {
    "url": "icons/icon-512.png",
    "revision": "4e338f893193734ae580b2094a04570f"
  },
  {
    "url": "icons/icon-72.png",
    "revision": "db24ede1b548217784308456095422a5"
  },
  {
    "url": "icons/icon-96.png",
    "revision": "7804358d076efd4477d9c69386673c1d"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Black.woff2",
    "revision": "6cfb460b4140c8544af1cee2e23359a2"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Bold.woff2",
    "revision": "7958481fe611c2574940c172068921bb"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-ExtraBold.woff2",
    "revision": "a0f99309cd35ee8634cac7d7f6d9f9bc"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-ExtraLight.woff2",
    "revision": "3d8ceebeffb457d5cb97b08977e23a3f"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Light.woff2",
    "revision": "6458eed8cf924e973b43dac780a737f8"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Medium.woff2",
    "revision": "dd2193b32cbe791734c97e4e167816bf"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Regular.woff2",
    "revision": "cdc140628f111dc1f6185775f968e379"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-SemiBold.woff2",
    "revision": "9260c192787251165aacac4e12c997ad"
  },
  {
    "url": "fonts/webfonts/Vazirmatn-Thin.woff2",
    "revision": "99086e7ee7b05991f5b02b7647952c4b"
  },
  {
    "url": "fonts/webfonts/Vazirmatn[wght].woff2",
    "revision": "f6d31671339db80142ceaf6382570e79"
  },
  {
    "url": "manifest.webmanifest",
    "revision": "342fe50979f020430aaf107cfab994cc"
  }
], {});
workbox_precaching_cleanupOutdatedCaches();workbox_routing_registerRoute(new workbox_routing_NavigationRoute(workbox_precaching_createHandlerBoundToURL("/index.html")));


