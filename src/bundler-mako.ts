import { Bundler as WebpackBundler } from '@umijs/bundler-webpack';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getDevBanner, getMakoConfig, getStats } from './utils';

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
      const makoConfig = getMakoConfig(this.config, config);
      makoConfig.plugins ??= [];
      let statsJson: any;
      makoConfig.plugins.push({
        name: 'mako-stats',
        generateEnd: (args: any) => {
          statsJson = args.stats;
        },
      });
      build({
        root: this.cwd,
        config: makoConfig,
        watch: false,
      })
        .then(() => {
          const statsUtil = getStats(statsJson);
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
    const makoConfig = getMakoConfig(this.config, config);

    return {
      onListening: async ({ port, hostname, listeningApp }: any) => {
        const hmrPort = port + 1;
        // proxy ws to mako server
        const wsProxy = createProxyMiddleware({
          // mako server in the same host so hard code is ok
          target: `http://${hostname}:${hmrPort}`,
          ws: true,
          logLevel: 'silent',
        });
        listeningApp.on('upgrade', wsProxy.upgrade);
        // mako dev
        const { build } = require('@umijs/mako');
        makoConfig.hmr = {};
        makoConfig.plugins ??= [];
        makoConfig.devServer = { port: port + 1, host: hostname };
        makoConfig.plugins.push({
          name: 'mako-dev',
          generateEnd: (args: any) => {
            const statsUtil = getStats(args.stats);
            const compilation = statsUtil.toJson();
            // console.log(compilation);
            // onDevCompileDone { startTime: 1720582011441, endTime: 1720582011804 }
            // console.log('onDevCompileDone', args);
            config.onCompileDone?.({
              ...args,
              stats: {
                ...args?.stats,
                compilation,
              },
            });
            if (args.isFirstCompile) {
              const protocol = this.config.https ? 'https:' : 'http:';
              const banner = getDevBanner(protocol, hostname, port);
              console.log(banner);
            }
          },
        });
        try {
          await build({
            root: this.cwd,
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
