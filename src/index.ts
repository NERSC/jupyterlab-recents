import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  IStateDB,
  PageConfig,
} from '@jupyterlab/coreutils';

import {
  IMainMenu,
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
  private stateDB: IStateDB;
  private _recents: Array<types.Recent>;

  constructor(commands: CommandRegistry, stateDB: IStateDB) {
    this.serverRoot = PageConfig.getOption('serverRoot');
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
    const files = recents.filter(r => r.contentType !== 'directory');
    const directories = recents.filter(r => r.contentType === 'directory');
    [directories, files].forEach(rs => {
      if (rs.length > 0) {
        rs.forEach(recent => {
          this.recentsMenu.addItem({
            command: CommandIDs.openRecent,
            args: { recent },
          });
        });
        this.recentsMenu.addItem({ type: 'separator' });
      }
    });
    this.recentsMenu.addItem({
      command: CommandIDs.clearRecents,
    });
  }

  async loadRecents() {
    const recents = await this.stateDB.fetch(StateIDs.recents);
    this.recents = (recents as Array<types.Recent>) || [];
  }

  async saveRecents(recents: Array<types.Recent>) {
    await this.stateDB.save(StateIDs.recents, recents);
  }

  async addRecent(path: string, contentType: string) {
    const recent: types.Recent = {
      root: this.serverRoot,
      path: path,
      contentType: contentType,
    };
    const directories = this.recents.filter(r => r.contentType === 'directory');
    const files = this.recents.filter(r => r.contentType !== 'directory');
    const destination = contentType === 'directory' ? directories : files;
    // Check if it's already present; if so remove it
    const existingIndex = destination.findIndex(r => r.path === path);
    if (existingIndex >= 0 ) {
      destination.splice(existingIndex, 1);
    }
    // Add to the front of the list
    destination.unshift(recent);
    // Keep up to 10 of each type of recent path
    if (destination.length > 10) {
      destination.pop();
    }
    await this.saveRecents(directories.concat(files));
    await this.loadRecents();
  }

  async clearRecents() {
    await this.stateDB.remove(StateIDs.recents);
    await this.loadRecents();
  }
}


const extension: JupyterFrontEndPlugin<void> = {
  id: PluginIDs.recents,
  autoStart: true,
  requires: [IStateDB, IMainMenu, IDocumentManager],
  activate: (
    app: JupyterFrontEnd,
    stateDB: IStateDB,
    mainMenu: IMainMenu,
    docManager: IDocumentManager,
  ) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
    const { commands } = app;
    const recentsManager = new RecentsManager(commands, stateDB);

    docManager.activateRequested.connect(async (_, path) => {
      const item = await docManager.services.contents.get(path, {
        content: false
      });
      const fileType = app.docRegistry.getFileTypeForModel(item);
      const contentType = fileType.contentType;
      await recentsManager.addRecent(path, contentType);
      // Add the containing directory, too
      if (contentType !== 'directory') {
        const parent = path.lastIndexOf('/') > 0 ? path.slice(0, path.lastIndexOf('/')) : '';
        if (parent) {
          await recentsManager.addRecent(parent, 'directory');
        }
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
        const needSlash = !recent.root.endsWith('/') && !recent.path.startsWith('/');
        const slash = needSlash ? '/' : '';
        return `${recent.root}${slash}${recent.path}`;
      },
    });
    commands.addCommand(CommandIDs.clearRecents, {
      execute: async () => {
        await recentsManager.clearRecents();
      },
      label: () => 'Clear Recents',
    });
    // Main menu
    mainMenu.fileMenu.addGroup([{
      type: 'submenu' as Menu.ItemType,
      submenu: recentsManager.recentsMenu,
    }], 1);
    // Try to merge with existing Group 1
    try {
      const groups = (mainMenu.fileMenu as any)._groups;
      let numRankOneGroups = 0;
      let openGroupIndex = -1;
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (group.rank === 1) {
          numRankOneGroups += 1;
          if (openGroupIndex < 0) {
            openGroupIndex = i;
          }
        }
      }
      if (numRankOneGroups === 2) {
        const openGroup = groups[openGroupIndex];
        openGroup.size = openGroup.size + 1;
        groups.splice(openGroupIndex + 1, 1);
        const fileMenu = (mainMenu.fileMenu as any).menu;
        const fileMenuItems = fileMenu._items;
        let removeSeparators = false;
        for (let i = fileMenuItems.length - 1; i > 0; i--) {
          const fileMenuItem = fileMenuItems[i];
          if (fileMenuItem.command === 'filebrowser:open-path') {
            break;
          }
          if (removeSeparators && fileMenuItem.type === 'separator') {
            fileMenu.removeItemAt(i);
          }
          else if (fileMenuItem.type === 'submenu') {
            const label = fileMenuItem.submenu.title.label;
            if (label === 'Recents') {
              removeSeparators = true;
            }
          }
        }
      }
    }
    catch (e) {}
    recentsManager.loadRecents();
  }
};

export default extension;
