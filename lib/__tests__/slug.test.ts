import test from "node:test";
import assert from "node:assert/strict";
import { slugify, generateJobSlug } from "../slug";

test("Slug Utility — slugify sanitizes and formats string properly", () => {
  assert.equal(slugify("Welder 6G (SMAW & FCAW)"), "welder-6g-smaw-and-fcaw");
  assert.equal(slugify("  Operator Excavator PC2000 / PC1250  "), "operator-excavator-pc2000-pc1250");
  assert.equal(slugify("HSE Mining Inspector (Pengawas K3 Tambang)"), "hse-mining-inspector-pengawas-k3-tambang");
  assert.equal(slugify("PT. Dian Pandu Pratama, Tbk!"), "pt-dian-pandu-pratama-tbk");
});

test("Slug Utility — generateJobSlug produces standard /job/{posisi}-at-{customer} format", () => {
  const slug1 = generateJobSlug("Welder Specialist 6G", "PATRIA ASTRA");
  assert.equal(slug1, "welder-specialist-6g-at-patria-astra");

  const slug2 = generateJobSlug("Mine Surveyor & Geodetic Specialist", "PT Berau Coal");
  assert.equal(slug2, "mine-surveyor-and-geodetic-specialist-at-pt-berau-coal");
});

test("Slug Utility — generateJobSlug appends optional disambiguation suffix", () => {
  const slugWithSuffix = generateJobSlug("Welder Specialist 6G", "PATRIA ASTRA", 2);
  assert.equal(slugWithSuffix, "welder-specialist-6g-at-patria-astra-2");
});
