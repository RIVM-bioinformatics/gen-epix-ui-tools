# @gen-epix/merge-locales

Vite plugin that merges locale JSON files from multiple source directories into a single set of locale files.

Later source directories take precedence when the same translation key occurs in more than one source. Nested objects are merged recursively; arrays and scalar values are replaced. Locale names are discovered from the JSON filenames, so no fixed list of locales is required.

```ts
import { mergeLocales } from '@gen-epix/merge-locales';

export default {
  plugins: [
    mergeLocales({
      outputPath: 'locale',
      sourceDirectories: [
        './src/locale',
        '../ui-core-components/src/locale',
        '../ui-core-form/src/locale',
      ],
    }),
  ],
};
```

Source directories are resolved relative to Vite's configured root. Nothing is written to the source tree:

- During development the merged locales are served from `outputPath` (for example `/locale/en.json`), re-merged on every request, with a full page reload whenever a source locale file changes.
- During a build the merged locales are emitted as assets under `outputPath`, relative to the build output directory.
