module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: Object.fromEntries(["bg","surface","surface2","line","ink","muted","accent","accentsoft","onaccent","good","goodsoft","bad","badsoft","warn","warnsoft"].map((k) => [k, `rgb(var(--${k}) / <alpha-value>)`])),
    fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"], mono: ["var(--font-mono)"] },
  } },
};
