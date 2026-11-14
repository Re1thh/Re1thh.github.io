// @ts-check
import { defineConfig } from "astro/config";

// Served from the user site repo (Re1thh.github.io), so no `base` is needed.
export default defineConfig({
  site: "https://re1thh.github.io",
  output: "static",
});
