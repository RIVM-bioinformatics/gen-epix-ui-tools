const esbuild = require('rollup-plugin-esbuild').default;
const dts = require('rollup-plugin-dts').default;

const packageJson = require('./package.json');

const bundle = input => ({
  input,
  external: id => !/^[./]/.test(id),
  plugins: [esbuild()],
  output: {
    file: 'bin/index.js',
    format: 'es',
    sourcemap: false,
  },
});

module.exports = [
  bundle('src/index.ts'),
  {
    input: 'src/index.ts',
    plugins: [dts()],
    output: {
      file: packageJson.types,
      format: 'es',
    },
  },
];
