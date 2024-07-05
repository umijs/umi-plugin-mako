import { IApi } from '@umijs/types';
import path from 'path';
import { Bundler } from './bundler-mako';

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
}
