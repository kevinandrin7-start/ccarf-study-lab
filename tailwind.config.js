const solid = (k) => `var(--${k})`;
const rgb = (k) => `rgb(var(--${k}-rgb) / <alpha-value>)`;
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: { extend: {
    colors: {
      bg: solid("bg"), card: solid("card"), fill: solid("fill"), sep: solid("sep"),
      label: solid("label"), label2: solid("label2"), label3: solid("label3"),
      blue: rgb("blue"), green: rgb("green"), red: rgb("red"), orange: rgb("orange"), yellow: rgb("yellow"),
    },
    fontFamily: { sans: ["var(--font)"], mono: ["var(--mono)"] },
  } },
};
