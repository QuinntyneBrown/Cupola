/* ==========================================================================
   Cupola Design System docs — shared chrome
   - injects the inline SVG icon sprite (works offline over file://)
   - renders the topbar brand + live UTC clock and the section sidenav
   - marks the active nav item from <body data-page="...">
   Pages declare: <body data-page="components/buttons" data-root="../">
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------- icon sprite */
  var ICONS = {
    "chevron-right": '<path d="M9 6l6 6-6 6"/>',
    "chevron-down": '<path d="M6 9l6 6 6-6"/>',
    "chevron-left": '<path d="M15 6l-6 6 6 6"/>',
    "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    "arrow-down": '<path d="M12 5v14M6 13l6 6 6-6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    telemetry: '<path d="M2 12h4l3-7 4 14 3-7h6"/>',
    plot: '<path d="M3 3v18h18M7 14l4-6 3 4 5-8"/>',
    "plot-stacked": '<path d="M3 3v18h18M6 8l4-3 4 2 5-4M6 15l4-2 4 3 5-5"/>',
    scatter: '<path d="M3 3v18h18M8 15v.01M11 9v.01M14 13v.01M17 6v.01M9 6v.01M16 16v.01"/>',
    "chart-bar": '<path d="M3 3v18h18M7 17v-5M11 17V7M15 17v-7M19 17v-3"/>',
    table: '<path d="M3 5h18v14H3zM3 10h18M9 5v14M15 5v14"/>',
    gauge: '<path d="M4 15a8 8 0 0 1 16 0M12 15l4-5M2.5 15h3M18.5 15h3"/>',
    image: '<path d="M3 5h18v14H3zM8 10h.01M3 16l5-4 4 3 4-5 5 6"/>',
    timeline: '<path d="M3 6h8M7 12h10M5 18h8M3 3v18"/>',
    notebook: '<path d="M5 3h13a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 3v18M12 8h4M12 12h4"/>',
    condition: '<path d="M6 3v7a4 4 0 0 0 4 4h7M13 10l4 4-4 4M6 3l-2 3h4z"/>',
    widget: '<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>',
    layout: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
    columns: '<path d="M3 4h18v16H3zM12 4v16"/>',
    tabs: '<path d="M3 5h18v14H3zM3 9h18M10 5v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M10 2h4M12 5V2M12 13l3-3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 13l4 4L19 7"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    "alert-triangle": '<path d="M12 3l10 18H2zM12 10v4M12 17.5v.01"/>',
    "alert-circle": '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.5 2.5 0 1 1 4 2c-.9.7-1.5 1.2-1.5 2.2M12 16.5v.01"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3zM10 20a2 2 0 0 0 4 0"/>',
    lock: '<path d="M5 11h14v9H5zM8 11V7a4 4 0 0 1 8 0v4"/>',
    link: '<path d="M9 12h6M10 8H7a4 4 0 0 0 0 8h3M14 8h3a4 4 0 0 1 0 8h-3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="M7 5l12 7-12 7z"/>',
    grip: '<path d="M9 6v.01M15 6v.01M9 12v.01M15 12v.01M9 18v.01M15 18v.01"/>',
    kebab: '<path d="M12 5v.01M12 12v.01M12 19v.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    star: '<path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1L12 17l-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/>',
    pin: '<path d="M9 3h6v6l2 4H7l2-4zM12 13v7"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    "zoom-in": '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M8 11h6M11 8v6"/>',
    "zoom-out": '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M8 11h6"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    grid: '<path d="M4 4h16v16H4zM4 12h16M12 4v16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M19 13v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/>',
    save: '<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 14h8v7H8z"/>',
    copy: '<path d="M9 9h11v11H9zM15 5H5v10"/>',
    move: '<path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9L2 12l3 3M19 9l3 3-3 3"/>',
    rotate: '<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<path d="M4 5h16v16H4zM4 9h16M8 3v4M16 3v4"/>',
    history: '<path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3M3 4v5h5M12 7v5l4 2"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5zM3 13.5l9 5 9-5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 5-4 2 2-5z"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    activity: '<path d="M2 12h4l3-8 6 16 3-8h4"/>',
    derived: '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
    sum: '<path d="M18 4H6l6 8-6 8h12"/>',
    flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>'
  };

  var sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">';
  for (var name in ICONS) {
    sprite += '<symbol id="i-' + name + '" viewBox="0 0 24 24">' + ICONS[name] + "</symbol>";
  }
  sprite += "</svg>";

  /* ------------------------------------------------------------------ nav */
  var NAV = [
    { group: "Overview", items: [["index", "Introduction", ""]] },
    {
      group: "Foundations",
      items: [
        ["foundations/color", "Color", "foundations/color.html"],
        ["foundations/typography", "Typography", "foundations/typography.html"],
        ["foundations/spacing", "Spacing & density", "foundations/spacing.html"],
        ["foundations/elevation", "Elevation & shape", "foundations/elevation.html"],
        ["foundations/iconography", "Iconography", "foundations/iconography.html"],
        ["foundations/motion", "Motion", "foundations/motion.html"]
      ]
    },
    {
      group: "Components",
      items: [
        ["components/buttons", "Buttons", "components/buttons.html"],
        ["components/form-controls", "Form controls", "components/form-controls.html"],
        ["components/menus", "Menus", "components/menus.html"],
        ["components/toolbars-tabs", "Toolbars & tabs", "components/toolbars-tabs.html"],
        ["components/tree", "Object tree", "components/tree.html"],
        ["components/tables", "Tables", "components/tables.html"],
        ["components/overlays", "Dialogs & overlays", "components/overlays.html"],
        ["components/indicators", "Indicators & chips", "components/indicators.html"],
        ["components/cards-panels", "Panes & panels", "components/cards-panels.html"]
      ]
    },
    {
      group: "Patterns",
      items: [
        ["patterns/shell", "Application shell", "patterns/shell.html"],
        ["patterns/time-conductor", "Time conductor", "patterns/time-conductor.html"],
        ["patterns/plots", "Plots & charts", "patterns/plots.html"],
        ["patterns/dashboard", "Layouts & dashboards", "patterns/dashboard.html"],
        ["patterns/gauges", "Gauges & widgets", "patterns/gauges.html"],
        ["patterns/imagery", "Imagery", "patterns/imagery.html"],
        ["patterns/timeline", "Plans & timelines", "patterns/timeline.html"],
        ["patterns/notebook", "Notebook", "patterns/notebook.html"]
      ]
    }
  ];

  function render() {
    document.body.insertAdjacentHTML("afterbegin", sprite);

    var root = document.body.getAttribute("data-root") || "";
    var page = document.body.getAttribute("data-page") || "";

    var topbar = document.getElementById("ds-topbar");
    if (topbar) {
      topbar.innerHTML =
        '<a class="ds-brand" href="' + root + 'index.html">' +
        '<span class="ds-brand-mark">Cup<span class="o">o</span>la</span>' +
        '<span class="ds-brand-sub">Design System</span></a>' +
        '<span class="ds-topbar-spacer"></span>' +
        '<span class="ds-utc" title="Coordinated Universal Time">' +
        '<span class="cp-dot cp-dot--ok"></span><span id="ds-utc-clock">--:--:--</span></span>' +
        '<span class="ds-version">v0.1 &middot; HTML mocks</span>';
    }

    var sidenav = document.getElementById("ds-sidenav");
    if (sidenav) {
      var html = "";
      NAV.forEach(function (g) {
        html += '<div class="ds-nav-group">' + g.group + "</div>";
        g.items.forEach(function (it) {
          var href = it[0] === "index" ? root + "index.html" : root + it[2];
          var cls = it[0] === page ? ' class="is-active" aria-current="page"' : "";
          html += '<a href="' + href + '"' + cls + ">" + it[1] + "</a>";
        });
      });
      sidenav.innerHTML = html;
    }

    /* live UTC clock — the masthead heartbeat */
    var el = document.getElementById("ds-utc-clock");
    if (el) {
      var tick = function () {
        var d = new Date();
        var p = function (n) { return String(n).padStart(2, "0"); };
        el.textContent =
          d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) +
          " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" + p(d.getUTCSeconds()) + " UTC";
      };
      tick();
      setInterval(tick, 1000);
    }

    /* light demo interactivity: toggle groups + demo tabs */
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-demo-toggle]");
      if (t) {
        var group = t.closest(".cp-toggle-group");
        if (group) {
          group.querySelectorAll("[data-demo-toggle]").forEach(function (b) {
            b.setAttribute("aria-pressed", b === t ? "true" : "false");
          });
        } else {
          t.setAttribute("aria-pressed", t.getAttribute("aria-pressed") === "true" ? "false" : "true");
        }
      }
      var tab = e.target.closest("[data-demo-tab]");
      if (tab) {
        var strip = tab.closest(".cp-tabs");
        strip.querySelectorAll("[data-demo-tab]").forEach(function (b) {
          b.setAttribute("aria-selected", b === tab ? "true" : "false");
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
