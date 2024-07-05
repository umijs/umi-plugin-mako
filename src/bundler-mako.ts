import { Bundler as WebpackBundler } from '@umijs/bundler-webpack';
import fs from 'fs';
import path from 'path';

require('./requireHook').init();

class Bundler extends WebpackBundler {
  static id = 'mako';
  static version = 1;

  constructor(opts: any) {
    super(opts);
  }

  async build({
    bundleConfigs,
    watch,
    onBuildComplete,
  }: {
    bundleConfigs: any;
    watch?: boolean;
    onBuildComplete?: any;
  }): Promise<{ stats?: any; compiler: any }> {
    return new Promise((resolve, reject) => {
      const { build } = require('@umijs/mako');
      if (watch) {
        // TODO: build 为什么有 watch ？
        // dev 好像不走这里
      }
      const config = bundleConfigs[0];

      // mako build need alias array
      const generatorAlias = Object.keys(config.resolve.alias).map((key) => {
        return [key, config.resolve.alias[key]];
      });
      // mako build need entry object
      const generatorEntry: any = {};
      Object.keys(config.entry).forEach((key) => {
        generatorEntry[key] = config.entry[key][0];
      });
      build({
        root: this.cwd,
        config: {
          mode: config.mode,
          devtool: false,
          autoCSSModules: true,
          less: {},
          resolve: { alias: generatorAlias },
          entry: generatorEntry,
          // always enable stats to provide json for onBuildComplete hook
          stats: {
            modules: false,
          },
        },
        watch: false,
      })
        .then(() => {
          const outputPath = path.resolve(
            this.cwd,
            this.config.outputPath || 'dist',
          );

          const statsJsonPath = path.join(outputPath, 'stats.json');
          const statsJson = JSON.parse(fs.readFileSync(statsJsonPath, 'utf-8'));

          // remove stats.json file
          fs.rmSync(statsJsonPath);
          const stats = {
            compilation: statsJson,
            hasErrors: () => false,
          };
          const statsUtil = {
            toJson: () => stats.compilation,
          };
          onBuildComplete?.(null, statsUtil);
          resolve({ stats: statsUtil, compiler: {} });
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  }

  //   setupDevServerOpts({
  //     bundleConfigs,
  //     bundleImplementor = defaultWebpack,
  //   }: {
  //     bundleConfigs: defaultWebpack.Configuration[];
  //     bundleImplementor?: typeof defaultWebpack;
  //   }): IServerOpts {
  //     const compiler = bundleImplementor.webpack(bundleConfigs);
  //     const { ssr, devServer } = this.config;
  //     // 这里不做 winPath 处理，是为了和下方的 path.sep 匹配上
  //     const compilerMiddleware = webpackDevMiddleware(compiler, {
  //       // must be /, otherwise it will exec next()
  //       publicPath: '/',
  //       logLevel: 'silent',
  //       // if `ssr` set false, next() into server-side render
  //       ...(ssr ? { index: false } : {}),
  //       writeToDisk: devServer && devServer?.writeToDisk,
  //       watchOptions: {
  //         // not watch outputPath dir and node_modules
  //         ignored: this.getIgnoredWatchRegExp(),
  //       },
  //     });

  //     function sendStats({
  //       server,
  //       sockets,
  //       stats,
  //     }: {
  //       server: Server;
  //       sockets: any;
  //       stats: defaultWebpack.Stats.ToJsonOutput;
  //     }) {
  //       server.sockWrite({ sockets, type: 'hash', data: stats.hash });

  //       if (stats.errors.length > 0) {
  //         server.sockWrite({ sockets, type: 'errors', data: stats.errors });
  //       } else if (stats.warnings.length > 0) {
  //         server.sockWrite({ sockets, type: 'warnings', data: stats.warnings });
  //       } else {
  //         server.sockWrite({ sockets, type: 'ok' });
  //       }
  //     }

  //     function getStats(stats: defaultWebpack.Stats) {
  //       return stats.toJson({
  //         all: false,
  //         hash: true,
  //         assets: true,
  //         warnings: true,
  //         errors: true,
  //         errorDetails: false,
  //       });
  //     }

  //     let _stats: defaultWebpack.Stats | null = null;

  //     return {
  //       compilerMiddleware,
  //       onListening: ({ server }) => {
  //         function addHooks(compiler: defaultWebpack.Compiler) {
  //           const { compile, invalid, done } = compiler.hooks;
  //           compile.tap('umi-dev-server', () => {
  //             server.sockWrite({ type: 'invalid' });
  //           });
  //           invalid.tap('umi-dev-server', () => {
  //             server.sockWrite({ type: 'invalid' });
  //           });
  //           done.tap('umi-dev-server', (stats) => {
  //             sendStats({
  //               server,
  //               sockets: server.sockets,
  //               stats: getStats(stats),
  //             });
  //             _stats = stats;
  //           });
  //         }
  //         if (compiler.compilers) {
  //           compiler.compilers.forEach(addHooks);
  //         } else {
  //           addHooks(compiler as any);
  //         }
  //       },
  //       onConnection: ({ connection, server }) => {
  //         if (_stats) {
  //           sendStats({
  //             server,
  //             sockets: [connection],
  //             stats: getStats(_stats),
  //           });
  //         }
  //       },
  //     };
  //   }
}

export { Bundler };
