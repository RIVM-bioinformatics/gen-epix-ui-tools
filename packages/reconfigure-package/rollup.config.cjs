const esbuild = require('rollup-plugin-esbuild').default;

const name = require('./package.json').main.replace(/\.js$/, '');

const bundle = config => ({
  ...config,
  input: 'src/reconfigure-package.ts',
  external: id => !/^[./]/.test(id),
});

module.exports = [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: `${name}.js`,
        format: 'es',
        sourcemap: false,
      },
    ],
  }),
];
