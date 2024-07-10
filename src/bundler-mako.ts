import { Bundler as WebpackBundler } from '@umijs/bundler-webpack';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';

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
  setupDevServerOpts({ bundleConfigs }: { bundleConfigs: any }): any {
    const config = bundleConfigs[0];
    // console.log(bundleConfigs);
    // mako build need alias array
    const generatorAlias = Object.keys(config.resolve.alias).map((key) => {
      return [key, config.resolve.alias[key]];
    });
    // mako build need entry object
    const generatorEntry: any = {};
    Object.keys(config.entry).forEach((key) => {
      generatorEntry[key] = config.entry[key][0];
    });
    return {
      onListening: async ({ server, port, hostname, listeningApp }: any) => {
        const hmrPort = port + 1;
        // proxy ws to mako server
        const wsProxy = createProxyMiddleware({
          // mako server in the same host so hard code is ok
          target: `http://${hostname}:${hmrPort}`,
          ws: true,
          logLevel: 'silent',
        });
        server.app.use('/__/hmr-ws', wsProxy);
        // server.app._router.stack.unshift(server.app._router.stack.pop());
        server.socketServer.on('upgrade', wsProxy.upgrade);

        // mako dev
        const { build } = require('@umijs/mako');
        const makoConfig: any = {
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
          plugins: [],
        };
        makoConfig.hmr = {};
        makoConfig.devServer = { port: hmrPort, host: hostname };
        makoConfig.plugins.push({
          name: 'mako-dev',
          generateEnd: (args: any) => {
            // onDevCompileDone { startTime: 1720582011441, endTime: 1720582011804 }
            // console.log('onDevCompileDone', args?.stats);
            config.onCompileDone?.({
              ...args,
              stats: {
                ...args?.stats,
                compilation: {
                  // FIXME: 现在 args stats，chunks 现在是写死的
                  chunks: [{ name: 'umi', files: ['umi.js', 'umi.css'] }],
                },
              },
            });
          },
        });
        // TODO: print banner
        console.log(`http://localhost:${port}`);
        const cwd = this.cwd;
        try {
          await build({
            root: cwd,
            config: makoConfig,
            watch: true,
          });
        } catch (e: any) {
          // opts.onBuildError?.(e);
          config.onCompileFail?.(e);

          console.error(e.message);
          const err: any = new Error('Build with mako failed.');
          err.stack = null;
          throw err;
        }
      },
      onConnection: ({ connection, server }: any) => {},
    };
  }
}

export { Bundler };
