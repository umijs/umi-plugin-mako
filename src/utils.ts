import address from '@umijs/deps/compiled/address';
import chalk from '@umijs/deps/compiled/chalk';
import lodash from 'lodash';
import path from 'path';

function getLessSourceMapConfig(devtool: any) {
  return (
    devtool && {
      sourceMapFileInline: true,
      outputSourceFiles: true,
    }
  );
}
export const getMakoConfig = (config: any, bundleConfig: any) => {
  const define: any = {};
  function normalizeDefineValue(val: string) {
    if (!lodash.isPlainObject(val)) {
      return JSON.stringify(val);
    } else {
      return Object.keys(val).reduce((obj: any, key: any) => {
        obj[key] = normalizeDefineValue(val[key]);
        return obj;
      }, {});
    }
  }
  if (config.define) {
    for (const key of Object.keys(config.define)) {
      // mako 的 define 会先去判断 process.env.xxx，再去判断 xxx
      // 这里传 process.env.xxx 反而不会生效
      // TODO: 待 mako 改成和 umi/webpack 的方式一致之后，可以把这段去掉
      if (key.startsWith('process.env.')) {
        define[key.replace(/^process\.env\./, '')] = normalizeDefineValue(
          config.define[key],
        );
      } else {
        define[key] = normalizeDefineValue(config.define[key]);
      }
    }
  }
  // mako build need alias array
  const generatorAlias = Object.keys(bundleConfig.resolve.alias).map((key) => {
    return [key, bundleConfig.resolve.alias[key]];
  });
  // mako build need entry object
  const generatorEntry: any = {};
  Object.keys(bundleConfig.entry).forEach((key) => {
    generatorEntry[key] = bundleConfig.entry[key][0];
  });

  const normalizedDevtool = config.devtool === false ? false : 'source-map';

  return {
    mode: bundleConfig.mode,
    devtool: config.devtool,
    autoCSSModules: true,
    less: {
      modifyVars: config.lessLoader?.modifyVars || config.theme,
      globalVars: config.lessLoader?.globalVars,
      sourceMap: getLessSourceMapConfig(normalizedDevtool),
      math: config.lessLoader?.math,
      plugins: config.lessLoader?.plugins,
    },
    resolve: { alias: generatorAlias },
    entry: generatorEntry,
    // always enable stats to provide json for onBuildComplete hook
    stats: {
      modules: false,
    },
    define,
    sass: config?.sass,
    ...(config?.mako || {}),
  };
};

export const getStats = (statsJson?: any) => {
  // 手动对标 chunks，主要是 @umijs/preset-built-in/lib/plugins/commands/htmlUtils.js 中用于生成 html
  const stats = {
    compilation: {
      ...statsJson,
      chunks: statsJson.chunks.map((chunk: any) => {
        chunk.name = path.basename(chunk.id, path.extname(chunk.id));
        return chunk;
      }),
    },
    hasErrors: () => false,
  };
  const statsUtil = {
    toJson: () => stats.compilation,
  };
  return statsUtil;
};

export const getDevBanner = (protocol: any, host: string, port: any) => {
  const ip = address.ip();
  const hostStr = host === '0.0.0.0' ? 'localhost' : host;
  const messages = [];
  messages.push('  App listening at:');
  messages.push(
    `  - Local:   ${chalk.cyan(`${protocol}//${hostStr}:${port}`)}`,
  );
  messages.push(`  - Network: ${chalk.cyan(`${protocol}//${ip}:${port}`)}`);
  return messages.join('\n');
};
