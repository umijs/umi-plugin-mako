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
  mako: {},
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

