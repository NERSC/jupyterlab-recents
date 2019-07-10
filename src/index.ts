import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  IStateDB,
  PageConfig,
} from '@jupyterlab/coreutils';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

import {
  IDocumentManager,
} from '@jupyterlab/docmanager';

import {
  Menu,
} from '@phosphor/widgets';

import {
  CommandRegistry,
} from '@phosphor/commands';

import {
  Signal,
} from '@phosphor/signaling';

namespace PluginIDs {
  export const recents = 'jupyterlab-recents';
}

namespace StateIDs {
  export const recents = `${PluginIDs}:recents`;
}

namespace CommandIDs {
  export const openRecent = `${PluginIDs.recents}:open-recent`;
  export const clearRecents = `${PluginIDs.recents}:clear-recents`;
}

namespace types {
  export type Recent = {
      root: string;
      path: string;
      contentType: string;
  }
}

class RecentsManager {
  public recentsMenu: Menu;
  public recentsChanged = new Signal<this, Array<types.Recent>>(this)
  private serverRoot: string;
  // private commands: CommandRegistry;
  private stateDB: IStateDB;
  private _recents: Array<types.Recent>;

  constructor(commands: CommandRegistry, stateDB: IStateDB) {
    this.serverRoot = PageConfig.getOption('serverRoot');
    // this.commands = commands;
    // console.log(this.commands);
    this.stateDB = stateDB;
    // This menu will appear in the File menu
    this.recentsMenu = new Menu({ commands });
    this.recentsMenu.title.label = 'Recents';
    // Listen for updates to _recents
    this.recentsChanged.connect((_, ) => {
      this.syncRecentsMenu();
    });
  }

  get recents(): Array<types.Recent> {
    const recents = this._recents || [];
    return recents.filter(r => r.root === this.serverRoot);
  }

  set recents(recents: Array<types.Recent>) {
    this._recents = recents;
    this.recentsChanged.emit(this.recents);
  }

  syncRecentsMenu() {
    this.recentsMenu.clearItems();
    const recents = this.recents;
    if (recents.length > 0) {
      recents.forEach(recent => {
        this.recentsMenu.addItem({
          command: CommandIDs.openRecent,
          args: { recent },
        });
      });
      this.recentsMenu.addItem({ type: 'separator' });
    }
    this.recentsMenu.addItem({
      command: CommandIDs.clearRecents,
    });
  }

  async loadRecents() {
    // const list = await this.stateDB.list({ ids: StateIDs.recents });
    // console.log('list: ', list);
    // const recents = await this.stateDB.fetch(StateIDs.recents);
    // console.log('loaded recents: ', recents);
    // return recents;
    console.log('loadRecents NOP');
  }

  async saveRecents(recents: Array<types.Recent>) {
    await this.stateDB.save(StateIDs.recents, recents);
  }

  addRecent(path: string, contentType: string) {
    const recent: types.Recent = {
      root: this.serverRoot,
      path: path,
      contentType: contentType,
    };
    console.log('recent: ', JSON.stringify(recent));
  }

  async clearRecents() {
    await this.stateDB.remove(StateIDs.recents);
  }
}


const extension: JupyterFrontEndPlugin<void> = {
  id: PluginIDs.recents,
  autoStart: true,
  requires: [IStateDB, IMainMenu, IDocumentManager],
  activate: async (
    app: JupyterFrontEnd,
    stateDB: IStateDB,
    mainMenu: IMainMenu,
    docManager: IDocumentManager,
  ) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
    const { commands } = app;
    const recentsManager = new RecentsManager(commands, stateDB);
    await recentsManager.loadRecents();

    docManager.activateRequested.connect(async (_, path) => {
      const item = await docManager.services.contents.get(path, {
        content: false
      });
      const fileType = app.docRegistry.getFileTypeForModel(item);
      const contentType = fileType.contentType;
      recentsManager.addRecent(path, contentType);
      // Add the containing directory, too
      if (contentType !== 'directory') {
        const parent = path.slice(0, path.lastIndexOf('/'));
        recentsManager.addRecent(parent, 'directory');
      }
    });
    // Commands
    commands.addCommand(CommandIDs.openRecent, {
      execute: args => {
        const recent = args.recent as types.Recent;
        commands.execute('filebrowser:open-path', { path: recent.path });
      },
      label: args => {
        const recent = args.recent as types.Recent;
        return recent.path;
      }
    });
    commands.addCommand(CommandIDs.clearRecents, {
      execute: async () => {
        await recentsManager.clearRecents();
      }
    });
    // Main menu
    mainMenu.fileMenu.addGroup([{
      type: 'submenu' as Menu.ItemType,
      submenu: recentsManager.recentsMenu,
    }], 0);
  }
};

export default extension;
