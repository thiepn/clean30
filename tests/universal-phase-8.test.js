import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function textFile(path) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Phase 8 visual layer loads after the accessibility polish layer", () => {
  const main = textFile("../src/main.jsx");
  const phaseSix = main.indexOf('"./styles/universal-phase6.css"');
  const phaseEight = main.indexOf('"./styles/universal-phase8.css"');
  assert.ok(phaseSix >= 0);
  assert.ok(phaseEight > phaseSix);
});

test("primary navigation keeps visible labels and decorative icons", () => {
  const navigation = textFile("../src/components/Navigation.jsx");
  assert.match(navigation, /label: "Clean", icon: "today"/);
  assert.match(navigation, /label: "Routines", icon: "routines"/);
  assert.match(navigation, /label: "Progress", icon: "progress"/);
  assert.match(navigation, /label: "Settings", icon: "settings"/);
  assert.match(navigation, /<span>\{item\.label\}<\/span>/);
  assert.match(navigation, /aria-current=/);
});

test("header has a branded mark without replacing the accessible app heading", () => {
  const layout = textFile("../src/components/Layout.jsx");
  assert.match(layout, /className="brand-mark" aria-hidden="true"/);
  assert.match(layout, /<h1>\{appName\}<\/h1>/);
  assert.match(layout, /aria-label="Open Clean30 help"/);
  assert.match(layout, /<AppIcon name="help"/);
});

test("visual polish keeps mobile navigation stable and safe-area aware", () => {
  const css = textFile("../src/styles/universal-phase8.css");
  assert.match(css, /\.mobile-navigation \{/);
  assert.match(css, /bottom: max\(8px, env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /backdrop-filter: blur\(22px\)/);
  assert.match(css, /grid-template-rows: 22px auto/);
  assert.match(css, /@media \(max-width: 360px\)/);
});

test("visual polish preserves reduced-motion support and large touch controls", () => {
  const css = textFile("../src/styles/universal-phase8.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /\.clean-mode-shell,/);
  assert.match(css, /\.today-cleaning-mode/);
});
