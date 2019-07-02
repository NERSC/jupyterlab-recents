import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  IStateDB,
} from '@jupyterlab/coreutils';

/**
 * Initialization data for the jupyterlab-recents extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-recents',
  autoStart: true,
  requires: [IStateDB],
  activate: (app: JupyterFrontEnd, stateDB: IStateDB) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
  }
};

export default extension;
