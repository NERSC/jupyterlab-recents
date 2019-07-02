import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';


/**
 * Initialization data for the jupyterlab-recents extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-recents',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-recents is activated!');
  }
};

export default extension;
