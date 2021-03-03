import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ContentsManager } from '@jupyterlab/services';
import { IStateDB } from '@jupyterlab/statedb';
import { CommandRegistry } from '@lumino/commands';
import { Signal } from '@lumino/signaling';
import { Menu } from '@lumino/widgets';

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
  };
}

namespace utils {
  export function mergePaths(root: string, path: string): string {
    if (root.endsWith('/')) {
      root = root.slice(0, -1);
    }
    if (path.endsWith('/')) {
      path = path.slice(1);
    }
    return `${root}/${path}`;
  }
}

class RecentsManager {
  public recentsMenu: Menu;
  private recentsChanged = new Signal<this, types.Recent[]>(this);
  private serverRoot: string;
  private stateDB: IStateDB;
  private contentsManager: ContentsManager;
  private _recents: types.Recent[];
  // Will store a Timemout call that saves recents changes after a delay
  private saveRoutine: any;
  // Will store a Timeout call that periodically runs to validate the recents
  private validator: any;
  // Whether there are local changes sent to be recorded without verification
  private awaitingSaveCompletion = false;

  constructor(
    commands: CommandRegistry,
    stateDB: IStateDB,
    contents: ContentsManager
  ) {
    this.serverRoot = PageConfig.getOption('serverRoot');
    this.stateDB = stateDB;
    this.contentsManager = contents;
    // This menu will appear in the File menu
    this.recentsMenu = new Menu({ commands });
    this.recentsMenu.title.label = 'Recents';
    // Listen for updates to _recents
    this.recentsChanged.connect(_ => {
      this.syncRecentsMenu();
    });
  }

  get recents(): types.Recent[] {
    const recents = this._recents || [];
    return recents.filter(r => r.root === this.serverRoot);
  }

  set recents(recents: types.Recent[]) {
    // Keep track of any recents pertaining to other roots
    const otherRecents = this._recents.filter(r => r.root !== this.serverRoot);
    const allRecents = recents
      .filter(r => r.root === this.serverRoot)
      .concat(otherRecents);
    this._recents = allRecents;
    this.saveRecents();
    this.recentsChanged.emit(this.recents);
  }

  async init() {
    await this.loadRecents();
    return this.validateRecents();
  }

  addRecent(path: string, contentType: string) {
    const recent: types.Recent = {
      root: this.serverRoot,
      path,
      contentType
    };
    const recents = this.recents;
    const directories = recents.filter(r => r.contentType === 'directory');
    const files = recents.filter(r => r.contentType !== 'directory');
    const destination = contentType === 'directory' ? directories : files;
    // Check if it's already present; if so remove it
    const existingIndex = destination.findIndex(r => r.path === path);
    if (existingIndex >= 0) {
      destination.splice(existingIndex, 1);
    }
    // Add to the front of the list
    destination.unshift(recent);
    // Keep up to 10 of each type of recent path
    if (destination.length > 10) {
      destination.pop();
    }
    this.recents = directories.concat(files);
  }

  removeRecents(paths: string[]) {
    const recents = this.recents;
    this.recents = recents.filter(r => paths.indexOf(r.path) === -1);
  }

  clearRecents() {
    this.recents = [];
  }

  async validateRecents() {
    clearTimeout(this.validator);
    // Unless triggered directly, recents will be validated every 12 seconds
    this.validator = setTimeout(this.validateRecents.bind(this), 12 * 1000);
    const recents = this.recents;
    const invalidPathsOrNulls = await Promise.all(
      recents.map(async r => {
        try {
          await this.contentsManager.get(r.path, { content: false });
          return null;
        } catch (e) {
          if (e.response.status === 404) {
            return r.path;
          }
        }
      })
    );
    const invalidPaths = invalidPathsOrNulls.filter(x => x !== null);
    if (invalidPaths.length > 0) {
      this.removeRecents(invalidPaths);
    }
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
            args: { recent }
          });
        });
        this.recentsMenu.addItem({ type: 'separator' });
      }
    });
    this.recentsMenu.addItem({
      command: CommandIDs.clearRecents
    });
  }

  async loadRecents() {
    const recents = await this.stateDB.fetch(StateIDs.recents);
    this._recents = (recents as types.Recent[]) || [];
    this.recentsChanged.emit(this.recents);
  }

  saveRecents() {
    clearTimeout(this.saveRoutine);
    // Save _recents 500 ms after the last time saveRecents has been called
    this.saveRoutine = setTimeout(async () => {
      // If there's a previous request pending, wait 500 ms and try again
      if (this.awaitingSaveCompletion) {
        this.saveRecents();
      } else {
        this.awaitingSaveCompletion = true;
        try {
          await this.stateDB.save(StateIDs.recents, this._recents);
          this.awaitingSaveCompletion = false;
        } catch (e) {
          this.awaitingSaveCompletion = false;
          console.log('Saving recents failed');
          // Try again
          this.saveRecents();
        }
      }
    }, 500);
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
    docManager: IDocumentManager
  ) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
    const { commands, serviceManager } = app;
    const recentsManager = new RecentsManager(
      commands,
      stateDB,
      serviceManager.contents
    );

    docManager.activateRequested.connect(async (_, path) => {
      const item = await docManager.services.contents.get(path, {
        content: false
      });
      const fileType = app.docRegistry.getFileTypeForModel(item);
      const contentType = fileType.contentType;
      recentsManager.addRecent(path, contentType);
      // Add the containing directory, too
      if (contentType !== 'directory') {
        const parent =
          path.lastIndexOf('/') > 0 ? path.slice(0, path.lastIndexOf('/')) : '';
        recentsManager.addRecent(parent, 'directory');
      }
    });
    // Commands
    commands.addCommand(CommandIDs.openRecent, {
      execute: async args => {
        const recent = args.recent as types.Recent;
        const path = recent.path === '' ? '/' : recent.path;
        await commands.execute('filebrowser:open-path', { path });
        // If path not found, validating will remove it after an error message
        return recentsManager.validateRecents();
      },
      label: args => {
        const recent = args.recent as types.Recent;
        return utils.mergePaths(recent.root, recent.path);
      }
    });
    commands.addCommand(CommandIDs.clearRecents, {
      execute: () => recentsManager.clearRecents(),
      label: () => 'Clear Recents'
    });
    // Main menu
    mainMenu.fileMenu.addGroup(
      [
        {
          type: 'submenu' as Menu.ItemType,
          submenu: recentsManager.recentsMenu
        }
      ],
      1
    );
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
          } else if (fileMenuItem.type === 'submenu') {
            const label = fileMenuItem.submenu.title.label;
            if (label === 'Recents') {
              removeSeparators = true;
            }
          }
        }
      }
    } catch (e) {
      console.debug(e);
    }
    recentsManager.init();
  }
};

export default extension;
