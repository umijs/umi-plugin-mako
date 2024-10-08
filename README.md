# Mako Plugin for Umi@3

## Install

```bash
$ npm i umi-plugin-mako -D
```

## Usage

Enable by config.

```ts
import { defineConfig } from 'umi';

export default defineConfig({
  mako: {
    // mako.config.json
    // mako config
  },
});
```

### Build

```bash
$ umi build

INFO Using mako@0.7.4
Building with mako for production...
dist/umi.css     0.04 kB
dist/umi.js    403.76 kB
✓ Built in 571ms
Complete!
 File              Size                        Gzipped

 dist/umi.js       394.3 KB                    93.3 KB
 dist/umi.css      35.0 B                      55.0 B

  Images and other types of assets omitted.

mako build complete
```

### Dev

```bash
$ umi dev

INFO Using mako@0.7.4
Starting the development server...
http://localhost:8000
Building with mako for development...
✓ Built in 352ms
```

## LICENSE

MIT

## Example

Please refer to [umi-antd-pro](https://github.com/alitajs/umi-antd-pro)'s [commit](https://github.com/alitajs/umi-antd-pro/commit/03103c82a78acbb1e27db46a26cbff2d77ff3d09) for usage cases

webpack

```bash
Theme generated successfully
 DONE  Compiled successfully in 38919ms              15:00:51

✨  Done in 41.77s.
```

mako

```bash

✓ Built in 4807ms
mako build complete
✨  Done in 7.82s.
```
