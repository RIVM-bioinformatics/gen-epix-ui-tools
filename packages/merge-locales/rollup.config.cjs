const esbuild = require('rollup-plugin-esbuild').default;
const dts = require('rollup-plugin-dts').default;

const packageJson = require('./package.json');

const bundle = input => ({
  input,
  external: id => !/^[./]/.test(id),
  plugins: [esbuild()],
  output: {
    file: `bin/${input.includes('index') ? 'index' : 'merge-locales'}.js`,
    format: 'es',
    sourcemap: false,
  },
});

module.exports = [
  bundle('src/index.ts'),
  bundle('src/merge-locales.ts'),
  {
    input: 'src/index.ts',
    plugins: [dts()],
    output: {
      file: packageJson.types,
      format: 'es',
    },
  },
];
