import { loadFont as loadArchivo } from "@remotion/google-fonts/Archivo";
import { loadFont as loadMichroma } from "@remotion/google-fonts/Michroma";
import { loadFont as loadSourceSans } from "@remotion/google-fonts/SourceSans3";

// Same three families as app/layout.tsx; values mirror app/globals.css (--svj-*).
export const archivo = loadArchivo("normal", { weights: ["600", "700"], subsets: ["latin"] }).fontFamily;
export const michroma = loadMichroma("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const sourceSans = loadSourceSans("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;

export const svj = {
  blue600: "#005e9b",
  blue500: "#0071bc",
  blue200: "#a9cde9",
  blue50: "#eaf3fa",
  navy900: "#0b1e2e",
  navy800: "#0f273a",
  navy700: "#163e5d",
  navy600: "#1d4e72",
  paper: "#f5f7f9",
  white: "#ffffff",
  gray300: "#b1bdc6",
  gray200: "#ced6dc",
  success: "#2f7d4a",
  navyField: "radial-gradient(120% 130% at 50% 55%, #163e5d, #0f273a 45%, #0b1e2e)",
};
