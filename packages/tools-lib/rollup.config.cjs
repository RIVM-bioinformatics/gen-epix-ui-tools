const dts = require('rollup-plugin-dts').default;
const esbuild = require('rollup-plugin-esbuild').default;

const bundle = config => ({
  ...config,
  input: 'src/index.ts',
  external: id => !/^[./]/.test(id),
});

module.exports = [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        dir: "dist",
        format: "es",
        exports: "named",
        preserveModules: true, // Keep directory structure and files
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      dir: "dist",
      format: "es",
      exports: "named",
      preserveModules: true, // Keep directory structure and files
    },
  }),
];
