/* PL—06 · D1 « Le voyage de la goutte ». Progressive enhancement: without JS or with reduced
   motion the page shows its final state (house revealed, thread drawn, everything readable). */
const situations = {
  leak: {
    kicker: "CE QUE VOUS POUVEZ DÉCRIRE",
    title: "Où l’eau apparaît-elle ?",
    copy: "Le lieu, depuis quand, et si la trace revient. Ces repères aident l’artisan à préparer son passage ; ils ne remplacent pas sa vérification sur place.",
    room: "cuisine",
  },
  hot: {
    kicker: "CE QUE VOUS POUVEZ DÉCRIRE",
    title: "L’eau chauffe-t-elle encore ?",
    copy: "Précisez l’équipement concerné et depuis quand le changement est apparu. La vérification dépendra de l’installation réelle.",
    room: "chauffe-eau",
  },
  project: {
    kicker: "CE QUE VOUS POUVEZ PRÉPARER",
    title: "Quelle pièce voulez-vous faire évoluer ?",
    copy: "Cuisine, salle d’eau ou réseau complet : quelques repères aident à préparer un premier échange utile.",
    room: "salle-d-eau",
  },
  urgent: {
    kicker: "EN CAS D’URGENCE",
    title: "L’eau coule et ne s’arrête pas ?",
    copy: "Premier geste : fermez la vanne d’arrêt près du compteur (repère « Arrivée d’eau » au chapitre 02). Si l’eau approche d’une prise, coupez l’électricité. Puis appelez l’artisan.",
    room: "arrivee",
  },
};

const rooms = {
  arrivee: "Compteur et vanne d’arrêt : accès, état, trace au raccord. C’est aussi le premier geste à connaître en cas d’urgence : couper l’eau.",
  cuisine: "Alimentations de l’évier, flexibles, joints, siphon et écoulement. Une trace sous l’évier se lit souvent à cet endroit.",
  "chauffe-eau": "Température, groupe de sécurité, pression, traces d’humidité ou de calcaire autour de l’appareil.",
  "salle-d-eau": "Robinetterie, douche, évacuations et joints : là où l’eau froide et l’eau chaude se retrouvent.",
};
const ROOM_NOTE = " Indicatif : le diagnostic se fait toujours sur place.";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktop = window.matchMedia("(min-width: 900px)");
const motionOK = !reduceMotion.matches;

/* ---------- 02: rooms ---------- */
function selectRoom(name, { scroll = false } = {}) {
  $$(".room").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.room === name)));
  $$(".marker, .hud").forEach((m) => m.classList.toggle("is-on", m.dataset.room === name));
  $(".house").classList.add("has-selection");
  $("#room-copy").textContent = rooms[name] + ROOM_NOTE;
  if (scroll) $("#reseau").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
}
const reveal = () => $(".house").classList.add("is-revealed");
$$(".room").forEach((b) => b.addEventListener("click", () => { selectRoom(b.dataset.room); reveal(); }));
$$(".marker").forEach((m) => m.addEventListener("click", () => { selectRoom(m.dataset.room); reveal(); }));

/* ---------- 01: situations (also orient the house in chapter 02) ---------- */
function selectSituation(kind) {
  const s = situations[kind];
  $$(".situation").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
  const answer = $(".answer");
  $("#answer-kicker").textContent = s.kicker;
  $("#answer-title").textContent = s.title;
  $("#answer-copy").textContent = s.copy;
  answer.classList.remove("is-swapping");
  void answer.offsetWidth;
  answer.classList.add("is-swapping");
  selectRoom(s.room);
  const cta = $(".signe-cta");
  const urgent = kind === "urgent";
  cta.setAttribute("href", urgent ? "#urgence" : "#contact");
  cta.firstChild.textContent = urgent ? "Appeler en urgence " : "Parler de mon besoin ";
  cta.classList.toggle("is-urgent", urgent);
}
$$(".situation").forEach((b) => b.addEventListener("click", () => selectSituation(b.dataset.kind)));

/* ---------- emergency call (demo): nothing is dialled ---------- */
$(".urgent-call").addEventListener("click", () => {
  $(".urgent-status").textContent = "Démonstration : aucun appel n’est passé. Sur le site de l’artisan, ce bouton composera son numéro d’urgence, avec ses horaires d’astreinte.";
});

/* ---------- demo contact form: checks the two useful fields, confirms, sends nothing ---------- */
const demoForm = $("#demo-form");
const demoStatus = $(".demo-form-status");
const formChecks = [
  [$("#f-signe"), (v) => v.trim().length >= 3],
  [$("#f-contact"), (v) => /^\+?[\d\s.()-]{8,}$/.test(v.trim()) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
];
const formSummary = $(".form-summary");
const labelOf = (input) => $(`label[for="${input.id}"]`).firstChild.textContent.trim();
const markField = (input, valid) => {
  input.setAttribute("aria-invalid", String(!valid));
  $(`#${input.id}-err`).hidden = valid;
};
// Summary at the top of the form: how many fields to fix, each a link to its field.
const showSummary = (invalid) => {
  formSummary.hidden = invalid.length === 0;
  if (!invalid.length) return;
  const n = invalid.length;
  formSummary.innerHTML = `<p><strong>${n === 1 ? "Un champ à compléter" : `${n} champs à compléter`}</strong></p><ul>${invalid.map((i) => `<li><a href="#${i.id}">${labelOf(i)}</a></li>`).join("")}</ul>`;
};
formSummary.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  e.preventDefault();
  $(link.getAttribute("href")).focus();
});
// Once a field has been flagged, it is checked again as the visitor types: the error clears as soon as it is right.
formChecks.forEach(([input, ok]) => input.addEventListener("input", () => {
  if (input.getAttribute("aria-invalid") !== "true") return;
  markField(input, ok(input.value));
  showSummary(formChecks.filter(([i]) => i.getAttribute("aria-invalid") === "true").map(([i]) => i));
}));
demoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const invalid = [];
  formChecks.forEach(([input, ok]) => {
    const valid = ok(input.value);
    markField(input, valid);
    if (!valid) invalid.push(input);
  });
  showSummary(invalid);
  if (invalid.length) { demoStatus.textContent = ""; invalid[0].focus(); return; }
  demoStatus.textContent = "Démonstration : votre demande n’a pas été envoyée. Sur le site de l’artisan, elle lui parviendra directement.";
  demoForm.reset();
});

/* ---------- header: firmer once scrolled, menu panel on small screens ---------- */
const siteHeader = $(".site-header");
const navToggle = $(".nav-toggle");
const setMenu = (open) => {
  siteHeader.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
};
navToggle.addEventListener("click", () => setMenu(navToggle.getAttribute("aria-expanded") !== "true"));
$$(".site-header nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && siteHeader.classList.contains("is-open")) { setMenu(false); navToggle.focus(); } });
let headerScrolled = false;
window.addEventListener("scroll", () => {
  const s = window.scrollY > 8;
  if (s !== headerScrolled) { headerScrolled = s; siteHeader.classList.toggle("is-scrolled", s); }
}, { passive: true });

/* ---------- chapter counter + nav state ---------- */
const counter = $(".counter-current");
const navLinks = $$(".site-header nav a");
const chapterIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const n = Number(entry.target.dataset.chapter);
    counter.textContent = String(n).padStart(2, "0");
    navLinks.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${entry.target.id}`)));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("[data-chapter]").forEach((s) => chapterIO.observe(s));
// The footer has its own map: the chapter counter steps aside there.
new IntersectionObserver(([e]) => $(".chapter-counter").classList.toggle("is-hidden", e.isIntersecting)).observe($(".site-footer"));

/* ---------- mobile contact bar: appears on scroll-up, never over the contact chapter ---------- */
const mobileBar = $(".mobile-contact");
let lastScrollY = 0; // read on the first scroll only: no layout read during start-up
let contactVisible = false;
new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; if (contactVisible) mobileBar.classList.remove("is-visible"); }, { threshold: 0.1 }).observe($("#contact"));
window.addEventListener("scroll", () => {
  const y = window.scrollY;
  const pastHero = y > window.innerHeight * 0.8;
  mobileBar.classList.toggle("is-visible", pastHero && !contactVisible && y < lastScrollY - 2);
  if (Math.abs(y - lastScrollY) > 2) lastScrollY = y;
}, { passive: true });

/* ---------- hero: the faucet drips ----------
   The photo's own drop (cut from OpenArt still A) swells, lets go and falls with gravity; the
   crown and the ripple (cut from still B, same camera) take over at the water. Time-based, so a
   fall looks like a fall; started by the first scroll, then a slow drip while the photo is seen. */
const drip = { drop: $(".drip-drop"), crown: $(".drip-crown"), ripple: $(".drip-ripple"), busy: false, timer: 0 };
// 1680 px master: the drop's bottom (y 682) falls to the water (y 1490).
const FALL = (1490 - 682) / 1680;
// The frame's height comes from a ResizeObserver: reading it on demand would force a full-page layout
// while the page is still loading (a 650 ms long task on mobile).
let dripFrameHeight = 0;
new ResizeObserver(([entry]) => { dripFrameHeight = entry.contentRect.height; }).observe(drip.drop.parentElement);
function dripOnce() {
  if (drip.busy || !motionOK || document.hidden || !dripFrameHeight) return;
  drip.busy = true;
  const { drop, crown, ripple } = drip;
  const dy = dripFrameHeight * FALL;
  drop.animate([{ transform: "none" }, { transform: "scale(0.97, 1.12)" }], { duration: 420, easing: "cubic-bezier(0.5, 0, 0.75, 0)" }).finished
    .then(() => drop.animate(
      [{ transform: "translateY(0) scale(0.97, 1.12)" }, { transform: `translateY(${dy.toFixed(1)}px) scale(0.9, 1.2)` }],
      { duration: 470, easing: "cubic-bezier(0.55, 0, 1, 0.45)", fill: "forwards" },
    ).finished)
    .then(() => {
      drop.getAnimations().forEach((a) => a.cancel());
      drop.style.opacity = "0";
      crown.animate([
        { opacity: 0, transform: "scale(0.55, 0.2)" },
        { opacity: 1, transform: "scale(1, 1)", offset: 0.2 },
        { opacity: 0.85, transform: "scale(1.04, 0.92)", offset: 0.45 },
        { opacity: 0, transform: "scale(1.1, 0.5)" },
      ], { duration: 950, easing: "ease-out" });
      ripple.animate([
        { opacity: 0, transform: "scale(0.3)" },
        { opacity: 1, transform: "scale(0.62)", offset: 0.14 },
        { opacity: 0, transform: "scale(1.38)" },
      ], { duration: 1700, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" });
      // A new drop gathers at the spout.
      setTimeout(() => {
        drop.style.opacity = "";
        drop.animate([{ opacity: 0, transform: "scale(0.12)" }, { opacity: 1, transform: "none" }], { duration: 1700, easing: "cubic-bezier(0.3, 0, 0.2, 1)" })
          .finished.then(() => { drip.busy = false; });
      }, 1050);
    })
    .catch(() => { drip.busy = false; });
}
if (motionOK && drip.drop.animate) {
  const firstScroll = () => { if (window.scrollY > 24) { window.removeEventListener("scroll", firstScroll); dripOnce(); } };
  window.addEventListener("scroll", firstScroll, { passive: true });
  new IntersectionObserver(([e]) => {
    clearInterval(drip.timer);
    if (!e.isIntersecting) return;
    drip.timer = setInterval(dripOnce, 6500);
    // The first drip waits for an idle moment, so it never competes with the page's first render.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
    setTimeout(() => idle(dripOnce, { timeout: 3000 }), 1800);
  }, { threshold: 0.6 }).observe($(".hero-media"));
}

/* ---------- the thread: one continuous water trail through the chapter anchors ---------- */
const main = $("main");
const threadSvg = $(".thread");
const threadBase = $(".thread-base");
const threadFlow = $(".thread-flow");
const trailPaths = [$(".thread-wet"), $(".thread-edge"), threadFlow, $(".thread-glint")];
const threadDrop = $(".thread-drop");
let dropOn = false;
let samples = [];
let threadLength = 0;

// The route only crosses empty space: from the ripple, beside the chapter 01 title, down the gap
// between picture and choices, into the house (hidden there: the network takes over), along the
// method rail, then down the right margin into the final call to action.
function threadRoute(mainBox) {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left - mainBox.left, right: r.right - mainBox.left, top: r.top - mainBox.top, bottom: r.bottom - mainBox.top, width: r.width, height: r.height };
  };
  const textRight = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Math.max(...[...range.getClientRects()].map((r) => r.right)) - mainBox.left;
  };
  const gutter = (mainBox.width - Math.min(mainBox.width, 1320)) / 2 || 36;
  const cta = box($(".contact-cta"));
  const pic = box($(".hero-media picture"));
  // Where the drop hits the water (x 655, y 1490 of the 1344×1680 still; the frame is 4:5 too).
  const splash = { x: pic.left + (pic.width * 655) / 1344, y: pic.top + (pic.height * 1490) / 1680 };
  if (!desktop.matches) {
    // Phone and tablet: from the ripple, out of the photo to the left gutter, then down into the CTA.
    // Small screens: the trail is a river that changes bank at each chapter. It runs down one gutter,
    // swaying gently like water on a wall, and crosses the screen in the empty band at the top of the next
    // chapter (above its number), so the visitor follows it from side to side. It always reaches chapter 02
    // on the left, where the house flow enters through the street pipe, and leaves 02 on the left too.
    const L = 10;
    const R = mainBox.width - 10;
    const mid = cta.top + cta.height / 2;
    const band = (sel) => { const b = box($(sel)); return b.top + Math.min(34, (box($(`${sel} .ch-number`)).top - b.top) * 0.45); };
    const sway = (x, y0, y1) => {
      const n = Math.max(1, Math.round((y1 - y0) / 130));
      return Array.from({ length: n }, (_, i) => ({ x: x + (i % 2 ? 3.5 : -3.5), y: y0 + ((i + 1) * (y1 - y0)) / n }));
    };
    const cross = (from, to, y) => [{ x: from, y: y - 6 }, { x: (from + to) / 2, y, h: true }, { x: to, y: y + 34 }];
    const r = box($("#reseau"));
    const signeY = band(".ch-signe");
    const contactY = band(".ch-contact");
    const signeEnd = r.top - 40;
    return [
      { ...splash, h: true },
      { x: L, y: splash.y + 46 },
      ...sway(L, splash.y + 46, signeY - 40),
      ...cross(L, R, signeY),
      ...sway(R, signeY + 34, signeEnd - 50),
      ...cross(R, L, signeEnd),
      { x: L, y: r.top + 4 },
      { x: R, y: r.bottom - 2 }, // hidden under the chapter: the house flow brings the water down the right bank
      ...sway(R, r.bottom, contactY - 40),
      ...cross(R, L, contactY),
      ...sway(L, contactY + 34, mid - 40),
      { x: L, y: mid - 8 },
      { x: cta.left + 18, y: mid, h: true },
    ];
  }
  const head = box($(".ch-signe .ch-head"));
  const cx = Math.max(splash.x, textRight($("#signe-title")) + 56, textRight($(".ch-signe .ch-lead")) + 56);
  const body = box($(".signe-body"));
  const gapX = (box($(".signe-media img")).right + box($(".signe-choices")).left) / 2;
  const reseau = box($("#reseau"));
  const houseBox = box($(".house"));
  const houseX = houseBox.left + (houseBox.width * HOUSE_X) / 100; // where the water enters the house
  const exitX = houseBox.left + (houseBox.width * EXIT_X) / 100; // where it leaves it (downpipe)
  const nodes = $$(".method-node").map(box);
  const method = box($(".method"));
  const arrow = box($(".contact-cta b"));
  const marginL = Math.max(64, gutter + 4); // clear of the fixed chapter counter
  const marginR = method.right + Math.min(36, (mainBox.width - method.right) / 2);
  const rail = nodes[0].top + nodes[0].height / 2;
  return [
    splash,
    { x: cx, y: head.top - 12 },
    { x: cx, y: head.bottom + 8 },
    { x: gapX, y: body.top + 4 },
    { x: gapX, y: body.bottom },
    { x: houseX, y: reseau.top + 2 },
    { x: exitX, y: reseau.bottom - 2 }, // hidden under the chapter: the house flow carries the water meanwhile
    { x: exitX, y: reseau.bottom + 8 },
    { x: exitX - 40, y: reseau.bottom + 48, h: true },
    { x: marginL + 40, y: reseau.bottom + 48, h: true },
    { x: marginL, y: reseau.bottom + 88 },
    { x: marginL, y: rail - 44 },
    { x: nodes[0].left + nodes[0].width / 2, y: rail, h: true },
    { x: nodes[nodes.length - 1].left + nodes[nodes.length - 1].width / 2, y: rail, h: true },
    { x: method.right, y: rail, h: true },
    { x: marginR, y: arrow.top - 70 },
    { x: arrow.left + 4, y: arrow.top + arrow.height / 2, h: true }, // stops at the arrow's edge
  ];
}

// Inside the house the water runs in the cutaway's own pipes (.pipe-glow, masks cut from the picture).
// The drawn trail brings it there, down the empty left edge from the top of the chapter to the end of the
// street pipe (14 %, 72 % of the frame); once the network is full, it leaves from the end of the bedroom
// pipe, down the outside wall and out of the scene (tail): one continuous journey, never a new start.
const HOUSE_X = 1; // desktop: the empty left edge of the picture
const STREET = [14, 72]; // where the street pipe leaves the picture
// Where the water leaves the house: the end of the cold pipe along the bedroom wall, then down the
// outside wall to the foot of the house. The page thread carries on from that same x (EXIT_X).
const EXIT = [[72.4, 56.8], [72.8, 63], [73, 70]];
const EXIT_X = 73;
const houseFlowSvg = $(".house-flow");
const houseGroups = Object.fromEntries($$(".hf-g").map((g) => [g.dataset.seg, g]));
const smooth = (pts) => {
  const f = (n) => n.toFixed(1);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q ${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
  }
  return `${d} L ${f(pts[pts.length - 1][0])} ${f(pts[pts.length - 1][1])}`;
};
function buildHouseFlow() {
  const house = $(".house").getBoundingClientRect();
  const pin = $(".reseau-pin").getBoundingClientRect();
  if (!house.height) return;
  const W = house.width;
  const H = house.height;
  // The edge the trail runs down: the picture's empty left margin on desktop, the page gutter (the same
  // x as the page thread, clear of the text) on small screens.
  const gx = desktop.matches ? (HOUSE_X / 100) * W : 10 - (house.left - main.getBoundingClientRect().left);
  // Where the water goes once out of the house. Desktop: straight down to the bottom of the pinned chapter.
  // Small screens: across to the right gutter (the river's bank), then down to the real end of chapter 02,
  // past the room buttons that follow the stage. Measured from the stage, so it holds pinned or not: the
  // distance from the end of the pin spacer to the end of the chapter does not change.
  let tailEnd;
  if (desktop.matches) tailEnd = [[(EXIT_X / 100) * W, pin.bottom - house.top]];
  else {
    const mainLeft = main.getBoundingClientRect().left;
    const rx = main.getBoundingClientRect().width - 10 - (house.left - mainLeft);
    const stage = $(".reseau-stage");
    const holder = stage.parentElement.classList.contains("pin-spacer") ? stage.parentElement : stage;
    const after = $("#reseau").getBoundingClientRect().bottom - holder.getBoundingClientRect().bottom;
    const end = stage.getBoundingClientRect().bottom - house.top + after;
    tailEnd = [[(EXIT_X / 100) * W, 0.76 * H], [rx, 0.8 * H], [rx, 0.86 * H], [rx, end]];
  }
  // Where the house sits before any pinning: a pinned element moves (fixed, then shifted to the end of its
  // spacer), its spacer does not. Small screens pin the stage inside the chapter, so the lead from the top of
  // the chapter is measured from that resting place, whatever the scroll position.
  let houseTop0 = house.top;
  const spacer = $(".house").closest(".pin-spacer");
  if (spacer && !desktop.matches) houseTop0 = house.top + (spacer.getBoundingClientRect().top - spacer.firstElementChild.getBoundingClientRect().top);
  const sx = (STREET[0] / 100) * W;
  const sy = (STREET[1] / 100) * H;
  const segs = {
    trunk: [[gx, pin.top - houseTop0], [gx, sy - 0.07 * H], [gx, sy - 0.015 * H], [gx + 0.03 * W, sy], [sx, sy]],
    tail: [...EXIT.map(([x, y]) => [(x / 100) * W, (y / 100) * H]), ...tailEnd],
  };
  houseFlowSvg.setAttribute("viewBox", `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
  for (const [name, pts] of Object.entries(segs)) {
    const g = houseGroups[name];
    const d = smooth(pts);
    g.querySelectorAll("path").forEach((p) => p.setAttribute("d", d));
    g.style.setProperty("--len", g.querySelector("path").getTotalLength().toFixed(1));
  }
}

function buildThread() {
  const mainBox = main.getBoundingClientRect();
  buildHouseFlow();
  const pts = threadRoute(mainBox);
  threadSvg.setAttribute("viewBox", `0 0 ${mainBox.width} ${mainBox.height}`);
  const f = (n) => n.toFixed(1);
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  const segs = [];
  for (let i = 1; i < pts.length; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const c1 = a.h ? [a.x + dx * 0.5, a.y] : [a.x, a.y + dy * 0.5];
    const c2 = b.h ? [b.x - dx * 0.5, b.y] : [b.x, b.y - dy * 0.5];
    segs.push([[a.x, a.y], c1, c2, [b.x, b.y]]);
    d += ` C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(b.x)} ${f(b.y)}`;
  }
  threadBase.setAttribute("d", d);
  trailPaths.forEach((p) => p.setAttribute("d", d));
  threadLength = threadFlow.getTotalLength();
  // Samples are computed from the curves themselves (getPointAtLength is slow). Each sample gets a
  // "virtual y": mostly horizontal stretches are spread over scroll distance so the rail draws
  // progressively instead of all at once.
  samples = [];
  let acc = 0;
  let stretch = 0;
  let prev = pts[0];
  for (const [a, c1, c2, b] of segs) {
    const n = Math.max(4, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14));
    for (let k = 1; k <= n; k += 1) {
      const t = k / n;
      const u = 1 - t;
      const x = u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0];
      const y = u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1];
      const sx = Math.abs(x - prev.x);
      const sy = Math.abs(y - prev.y);
      acc += Math.hypot(sx, sy);
      stretch = sx > sy * 1.5 ? stretch + sx * 0.45 : 0;
      samples.push([acc, y + stretch, x, y]); // x, y: where the drop sits when the trail is drawn up to here
      prev = { x, y };
    }
  }
  const scale = acc ? threadLength / acc : 1;
  samples.forEach((s) => { s[0] *= scale; });
  trailPaths.forEach((p) => { p.style.strokeDasharray = `${threadLength} ${threadLength}`; });
  updateThread();
}

let buildQueued = false;
function scheduleBuild() {
  if (buildQueued) return;
  buildQueued = true;
  requestAnimationFrame(() => { buildQueued = false; buildThread(); });
}

function updateThread() {
  if (!threadLength) return;
  let offset = 0;
  if (motionOK) {
    const front = window.innerHeight * 0.76 - main.getBoundingClientRect().top;
    let drawn = 0;
    let head = null;
    for (const s of samples) if (s[1] <= front && s[0] > drawn) { drawn = s[0]; head = s; }
    offset = threadLength - drawn;
    if (drawn >= threadLength - 24) $(".contact-cta").classList.add("is-reached");
    // Small screens: a drop of water rides the head of the trail (hidden at the start and the end).
    if (!desktop.matches) {
      const on = drawn > 40 && drawn < threadLength - 40;
      if (on !== dropOn) { dropOn = on; threadDrop.classList.toggle("is-on", on); }
      if (on && head) threadDrop.style.transform = `translate(${head[2].toFixed(1)}px, ${head[3].toFixed(1)}px)`;
    }
  } else {
    $(".contact-cta").classList.add("is-reached");
  }
  trailPaths.forEach((p) => { p.style.strokeDashoffset = String(offset); });
}

let threadTick = false;
window.addEventListener("scroll", () => {
  if (threadTick) return;
  threadTick = true;
  requestAnimationFrame(() => { updateThread(); threadTick = false; });
}, { passive: true });
let resizeTimer;
window.addEventListener("resize", () => { if (!threadStarted) return; clearTimeout(resizeTimer); resizeTimer = setTimeout(scheduleBuild, 150); });
// The photo settles in with a CSS animation: measure again once it is in place.
$(".hero-media").addEventListener("animationend", () => { if (threadStarted) scheduleBuild(); });
// Content that changes the page height (form messages, details) moves the anchors: measure again.
new ResizeObserver(() => { if (threadStarted) scheduleBuild(); }).observe(main);

/* ---------- motion layer (GSAP) ---------- */
function setupMotion() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("js-motion");
  // Motion may start mid-scroll: measure again once that first scroll has settled.
  const settle = () => { ScrollTrigger.removeEventListener("scrollEnd", settle); ScrollTrigger.refresh(); };
  ScrollTrigger.addEventListener("scrollEnd", settle);

  $$(".ch-head, .signe-media, .situation-list, .answer, .method-step, .contact-media, .contact-copy > *").forEach((el) => el.classList.add("reveal"));
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });

  // Rebuilt after each layout refresh only (not at every scroll stop: the measures do not depend on the
  // scroll position, and a rebuild costs ~70 ms on a slow phone).
  ScrollTrigger.addEventListener("refresh", scheduleBuild);
  $$(".method-step").forEach((step, i) => ScrollTrigger.create({ trigger: step, start: () => `top ${desktop.matches ? 72 - i * 9 : 72}%`, onEnter: () => step.classList.add("is-lit"), onLeaveBack: () => step.classList.remove("is-lit") }));

  // Chapter 02: the façade fades away on the cutaway, then the rooms light up.
  gsap.set(".marker", { opacity: 0, scale: 0.4 });
  gsap.set(".hud, .pipe-tag", { opacity: 0 });
  const steps = $$(".reseau-step");
  const caption = $(".stage-caption");
  let shownStep = -1;
  const setStep = (i) => {
    steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
    if (i === shownStep) return;
    shownStep = i;
    caption.innerHTML = `<span>0${i + 1}</span><span class="stage-caption-text">${steps[i].innerHTML}</span>`;
  };

  const houseTimeline = () => gsap.timeline()
    .addLabel("walls")
    .fromTo(".house-cut img", { scale: 1.02 }, { scale: 1, duration: 1.6, ease: "power1.out" }, "walls")
    // The cutaway only appears as the façade fades: no ghost walls behind the façade's soft edges.
    .fromTo(".house-cut", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power1.inOut" }, "walls+=0.3")
    .to(".h-facade", { opacity: 0, duration: 1.6, ease: "power1.inOut" }, "walls")
    .to(".marker", { opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(2)" }, "walls+=1.4")
    .to(".hud", { opacity: 1, duration: 0.4, stagger: 0.1 }, "walls+=1.8")
    .to(".pipe-tag", { opacity: 1, duration: 0.4, stagger: 0.1 }, "walls+=1.6")
    // The water runs through the network as the walls open, and leaves toward 03 at the end.
    .fromTo('.hf-g[data-seg="trunk"]', { "--hf": 1 }, { "--hf": 0, duration: 0.7, ease: "none" }, "walls")
    // Then the house's own pipes fill: cold water from the street pipe, hot water from the heater.
    .fromTo(".pipe-glow", { "--ef": 0 }, { "--ef": 1, duration: 1.1, ease: "power1.in" }, "walls+=0.7")
    .fromTo(".pipe-glow", { "--ec": 0 }, { "--ec": 1, duration: 0.6, ease: "none", immediateRender: false }, "walls+=1.5")
    .fromTo('.hf-g[data-seg="tail"]', { "--hf": 1 }, { "--hf": 0, duration: 0.5, ease: "none" }, "walls+=2.0");

  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    const tl = houseTimeline();
    ScrollTrigger.create({
      trigger: ".reseau-pin",
      start: "top top",
      end: "+=160%",
      pin: true,
      scrub: 0.6,
      animation: tl,
      onUpdate: (self) => setStep(self.progress < 0.18 ? 0 : self.progress < 0.62 ? 1 : 2),
    });
  });
  mm.add("(max-width: 899px)", () => {
    const tl = houseTimeline();
    // The stage (house, caption, legend) stays under the header while the visitor scrolls: the façade
    // fades, the water enters at the meter and runs through the network, step by step, like on desktop.
    setStep(0);
    ScrollTrigger.create({
      trigger: ".reseau-stage",
      // Centred in the space under the header: no empty band below the house while it is pinned.
      start: () => { const top = siteHeader.getBoundingClientRect().bottom + 6; return `center ${Math.round((top + window.innerHeight) / 2)}px`; },
      end: "+=130%",
      pin: true,
      scrub: 0.6,
      animation: tl,
      onUpdate: (self) => setStep(self.progress < 0.18 ? 0 : self.progress < 0.62 ? 1 : 2),
    });
  });
  // Measure now (ScrollTrigger scrolls to measure, then restores), and only report "ready" once
  // that is over, so a pending in-page jump is not cancelled by the measurement.
  ScrollTrigger.refresh();
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

// Until the motion layer runs, the page shows its final state (all steps readable).
$$(".reseau-step").forEach((s) => s.classList.add("is-active"));

// GSAP is not needed to read the page: it loads at the visitor's first sign of intent (scroll,
// touch, key, pointer), so the first paint never waits for it.
const INTENT = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"];
const loadScript = (src) => new Promise((resolve, reject) => {
  const el = document.createElement("script");
  el.src = src;
  el.onload = resolve;
  el.onerror = reject;
  document.head.append(el);
});
let motionReady = null;
function startMotion() {
  if (motionReady) return motionReady;
  INTENT.forEach((type) => window.removeEventListener(type, startMotion));
  motionReady = loadScript("vendor/gsap.min.js")
    .then(() => loadScript("vendor/ScrollTrigger.min.js"))
    .then(setupMotion)
    .catch(() => { /* motion is an enhancement: the final state stays */ });
  return motionReady;
}

// Where a chapter lands: under the sticky header (the CSS scroll-padding), within the page.
const targetY = (el) => {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  return Math.max(0, Math.min(el.getBoundingClientRect().top + window.scrollY - pad, document.documentElement.scrollHeight - window.innerHeight));
};
const jumpTo = (el) => window.scrollTo({ top: targetY(el), behavior: "instant" });
// The browser's smooth scroll is cut short when the pins re-measure the page mid-way; this glide
// measures the target again on every frame, lands on it, and yields as soon as the visitor scrolls.
let glide = 0;
function glideTo(el) {
  if (!motionOK) { jumpTo(el); return; }
  const id = ++glide;
  const from = window.scrollY;
  const duration = Math.min(1400, 500 + Math.abs(targetY(el) - from) * 0.12);
  const t0 = performance.now();
  const stop = () => { glide += 1; };
  ["wheel", "touchstart", "keydown"].forEach((type) => window.addEventListener(type, stop, { once: true, passive: true }));
  const step = (now) => {
    if (id !== glide) return;
    const t = Math.min(1, (now - t0) / duration);
    window.scrollTo({ top: from + (targetY(el) - from) * (1 - (1 - t) ** 3), behavior: "instant" });
    if (t < 1) requestAnimationFrame(step);
    else setTimeout(() => { if (id === glide && Math.abs(window.scrollY - targetY(el)) > 2) jumpTo(el); }, 300);
  };
  requestAnimationFrame(step);
}

// In-page links: when the click is also the first intent, the motion layer (and its pin spacer)
// loads first, then the page glides to the target, so the jump lands on the right chapter.
$$('a[href^="#"]:not(.skip-link):not(.contact-cta)').forEach((a) => a.addEventListener("click", (e) => {
  const target = document.querySelector(a.getAttribute("href"));
  if (!target) return;
  e.preventDefault();
  const ready = motionOK ? startMotion() : Promise.resolve();
  ready.then(() => {
    glideTo(target);
    history.replaceState(null, "", a.getAttribute("href"));
  });
}));
if (motionOK) INTENT.forEach((type) => window.addEventListener(type, startMotion, { passive: true }));

// The thread is measured from the final layout; it is built at the first sign of intent too
// (nothing of it is needed for the first paint), then kept in sync on resize and refresh.
let threadStarted = false;
function startThread() {
  if (threadStarted) return;
  threadStarted = true;
  INTENT.forEach((type) => window.removeEventListener(type, startThread));
  scheduleBuild();
  if (document.fonts) document.fonts.ready.then(scheduleBuild);
}
INTENT.forEach((type) => window.addEventListener(type, startThread, { passive: true }));
// A page opened mid-way (reload, link to a chapter) starts both layers after the first paint:
// reading scrollY during start-up would force the whole layout inside this script.
// Opened on a chapter (#geste…): the motion layer adds the pin spacer above it, so once it is
// ready the page lands on the chapter again.
window.addEventListener("load", () => {
  const target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (!motionOK) { startThread(); if (target) jumpTo(target); return; }
  const start = () => {
    startMotion().then(() => { if (target) { jumpTo(target); setTimeout(() => jumpTo(target), 300); } });
    startThread();
  };
  if (target) { start(); return; }
  // Reopened mid-page (reload)? Observed rather than measured: reading scrollY here would force the
  // whole pending layout inside this task (a 100–800 ms long task on mobile). The observer runs after
  // the browser's own layout, where scrollY is free to read.
  const io = new IntersectionObserver(([entry]) => {
    io.disconnect();
    if (entry.intersectionRatio < 1 && window.scrollY > 0) start();
  }, { threshold: [0, 1] });
  io.observe($(".hero-copy"));
});
