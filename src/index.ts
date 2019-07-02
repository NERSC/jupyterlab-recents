import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  IStateDB,
} from '@jupyterlab/coreutils';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

/**
 * Initialization data for the jupyterlab-recents extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-recents',
  autoStart: true,
  requires: [IStateDB, IMainMenu],
  activate: (app: JupyterFrontEnd, stateDB: IStateDB, mainMenu: IMainMenu) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
  }
};

export default extension;
