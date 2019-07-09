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

namespace PluginIDs {
  export const recents = 'jupyterlab-recents';
}

namespace StateIDs {
  export const recents = `${PluginIDs}:recents`;
}

namespace types {
  export type Recent = {
      root: string;
      path: string;
      contentType: string;
  }
}

class RecentsManager {
  private stateDB: IStateDB;

  constructor(stateDB: IStateDB) {
    this.stateDB = stateDB;
  }

  async loadRecents() {
    const recents = await this.stateDB.fetch(StateIDs.recents);
    return recents;
  }

  saveRecents(recents: Array<types.Recent>) {
    this.stateDB.save(StateIDs.recents, recents);
  }
}


const extension: JupyterFrontEndPlugin<void> = {
  id: PluginIDs.recents,
  autoStart: true,
  requires: [IStateDB, IMainMenu],
  activate: (app: JupyterFrontEnd, stateDB: IStateDB, mainMenu: IMainMenu) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
    const recentsManager = new RecentsManager(stateDB);
    console.log(recentsManager);
  }
};

export default extension;
