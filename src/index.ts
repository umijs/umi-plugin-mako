import { IApi } from '@umijs/types';
import path from 'path';
import { Bundler } from './bundler-mako';
// @ts-ignore
import { getHtmlGenerator } from '@umijs/preset-built-in/lib/plugins/commands/htmlUtils';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
// @ts-ignore
import { OUTPUT_SERVER_FILENAME } from '@umijs/preset-built-in/lib/plugins/features/ssr/constants';

export default function (api: IApi) {
  api.describe({
    key: 'mako',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
  if (!api.userConfig.mako) return;
  api.modifyConfig((memo) => {
    return {
      ...memo,
      mfsu: false,
    };
  });
  api.modifyBundler(() => {
    return Bundler;
  });
  api.onStart(() => {
    try {
      const pkg = require(path.join(
        require.resolve('@umijs/mako'),
        '../../package.json',
      ));
      api.logger.info(`Using mako@${pkg.version}`);
    } catch (e) {
      console.error(e);
    }
  });
  // maybe hack but useful
  function ensureServerFileExisted() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (
          existsSync(join(api.paths.absOutputPath!, OUTPUT_SERVER_FILENAME))
        ) {
          clearInterval(interval);
          resolve({});
        }
      }, 300);
    });
  }
  api.onBuildComplete(async ({ err, stats }) => {
    console.log('mako build complete');
    if (!err) {
      const compilation = (stats as any).toJson();
      if (api.config.ssr) {
        // waiting umi.server.js emited
        await ensureServerFileExisted();
      }
      const html = getHtmlGenerator({ api });
      const routeMap = await api.applyPlugins({
        key: 'modifyExportRouteMap',
        type: api.ApplyPluginsType.modify,
        initialValue: [{ route: { path: '/' }, file: 'index.html' }],
        args: {
          html,
        },
      });
      for (const { route, file } of routeMap) {
        const defaultContent = await html.getContent({
          route,
          noChunk: true,
          assets: compilation.assets,
          chunks: compilation.chunks,
        });
        const content = await api.applyPlugins({
          key: 'modifyProdHTMLContent',
          type: api.ApplyPluginsType.modify,
          initialValue: defaultContent,
          args: {
            route,
            file,
          },
        });
        const outputHtml = join(api.paths.absOutputPath!, file);
        writeFileSync(outputHtml, content, 'utf-8');
      }
    }
  });
}
