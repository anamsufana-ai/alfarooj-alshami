// "Install app" bar shown at the very top of the page.
// Shown to every visitor. Where the browser offers its install window (Chrome, Edge, Samsung Internet)
// the Install button opens it; otherwise (iPhone, iPad, other browsers) it shows the two taps to add the app.
// Hidden once the app is installed, or for 14 days after the visitor closes it.
(function () {
  var script = document.currentScript;
  var cfg = script ? script.dataset : {};
  var KEY = "install-bar-hidden-until";
  var standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (standalone) return;
  try {
    if (Number(localStorage.getItem(KEY)) > Date.now()) return;
  } catch (e) {}

  var ua = navigator.userAgent;
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  var deferred = null;
  var bar = null;
  var help = null;

  function isAr() { return document.documentElement.lang === "ar"; }
  function text() {
    return isAr()
      ? { title: "حمّل تطبيق " + (cfg.nameAr || cfg.name), sub: "بلمسة واحدة من شاشة هاتفك", btn: "تثبيت", close: "إغلاق",
          ios: "اضغط زر المشاركة ⬆︎ في أسفل Safari، ثم «إضافة إلى الشاشة الرئيسية».",
          android: "اضغط القائمة ⋮ في أعلى المتصفح، ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
          desktop: "في Chrome أو Edge: اضغط أيقونة التثبيت في شريط العنوان، أو القائمة ⋮ ثم «تثبيت»." }
      : { title: "Get the " + cfg.name + " app", sub: "One tap from your home screen", btn: "Install", close: "Close",
          ios: "Tap the Share button ⬆︎ at the bottom of Safari, then “Add to Home Screen”.",
          android: "Tap the menu ⋮ at the top of your browser, then “Install app” or “Add to Home screen”.",
          desktop: "In Chrome or Edge: click the install icon in the address bar, or the menu ⋮ then “Install”." };
  }

  function css(el, styles) { for (var k in styles) el.style[k] = styles[k]; }

  function render() {
    if (!bar) return;
    var t = text();
    bar.dir = isAr() ? "rtl" : "ltr";
    bar.querySelector("[data-title]").textContent = t.title;
    bar.querySelector("[data-sub]").textContent = t.sub;
    bar.querySelector("[data-btn]").textContent = t.btn;
    bar.querySelector("[data-close]").setAttribute("aria-label", t.close);
    if (help) help.textContent = isIOS ? t.ios : isAndroid ? t.android : t.desktop;
  }

  function setHeight() {
    document.documentElement.style.setProperty("--install-bar", (bar ? bar.offsetHeight : 0) + "px");
  }

  function hide(days) {
    if (bar) bar.remove();
    bar = null;
    setHeight();
    if (days) try { localStorage.setItem(KEY, String(Date.now() + days * 86400000)); } catch (e) {}
  }

  function build() {
    if (bar || !document.body) return;
    bar = document.createElement("div");
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Install app");
    css(bar, { display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: cfg.bg || "#1f1f1f",
      color: cfg.fg || "#ffffff", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontSize: "14px",
      lineHeight: "1.25", borderBottom: "2px solid " + (cfg.accent || "#f7a21b"), position: "relative", zIndex: "60", flexWrap: "wrap" });
    bar.innerHTML =
      '<img src="/apple-touch-icon.png" alt="" width="34" height="34" style="border-radius:8px;flex:none">' +
      '<span style="flex:1;min-width:0;display:flex;flex-direction:column"><strong data-title style="font-weight:700"></strong>' +
      '<span data-sub style="opacity:.8;font-size:12px"></span></span>' +
      '<button type="button" data-btn style="flex:none;border:0;border-radius:999px;padding:8px 16px;font:inherit;font-weight:700;cursor:pointer"></button>' +
      '<button type="button" data-close style="flex:none;border:0;background:transparent;color:inherit;font-size:22px;line-height:1;padding:0 4px;cursor:pointer;opacity:.75">×</button>';
    css(bar.querySelector("[data-btn]"), { background: cfg.accent || "#f7a21b", color: cfg.accentInk || "#111111" });
    bar.querySelector("[data-close]").addEventListener("click", function () { hide(14); });
    bar.querySelector("[data-btn]").addEventListener("click", function () {
      if (deferred) {
        deferred.prompt();
        deferred.userChoice.then(function (choice) { if (choice.outcome === "accepted") hide(); });
        deferred = null;
      } else {
        if (!help) {
          help = document.createElement("div");
          css(help, { flexBasis: "100%", padding: "8px 2px 2px", fontSize: "13px" });
          bar.appendChild(help);
        }
        render();
        setHeight();
      }
    });
    document.body.insertBefore(bar, document.body.firstChild);
    render();
    setHeight();
    window.addEventListener("resize", setHeight);
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferred = event;
    if (help) { help.remove(); help = null; setHeight(); }
  });
  window.addEventListener("appinstalled", function () { hide(); });
  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();
