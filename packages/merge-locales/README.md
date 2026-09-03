# @gen-epix/merge-locales

Merge locale JSON files from multiple source directories into one locale directory, either from a CLI or Vite.

Later source directories take precedence when the same translation key occurs in more than one source. Nested objects are merged recursively; arrays and scalar values are replaced.

```sh
merge-locales <output-directory> <source-directory> [...source-directories]
```

For example:

```sh
merge-locales ./public/locale ./src/locale ../ui-core-components/src/locale ../ui-core-form/src/locale
```

The command discovers locale names from the JSON filenames, so it does not require a fixed list of locales.

## Vite plugin

```ts
import { mergeLocales } from '@gen-epix/merge-locales';

export default {
 plugins: [
  mergeLocales({
   outputDirectory: './public/locale',
   sourceDirectories: [
    './src/locale',
    '../ui-core-components/src/locale',
    '../ui-core-form/src/locale',
   ],
  }),
 ],
};
```

Paths are resolved relative to Vite's configured root. Locale files are merged when the dev server starts and whenever a source locale changes, with a full page reload. Production builds merge the files during the build lifecycle. Later source directories take precedence.
