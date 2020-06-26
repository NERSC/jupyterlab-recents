# jupyterlab-recents

Track recent files and folders.


## Prerequisites

* JupyterLab
* For development, an active `conda` environment with `nodejs`

## Installation

```bash
jupyter labextension install jupyterlab-recents
```

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

## Legacy Jupyterlab v1 Support

Via NPM:
```{bash}
jupyter labextension install jupyterlab-recents@1.0.1
```

Or use the tagged 1.0.0 release at:
https://github.com/NERSC/jupyterlab-recents/tree/v1.0.1
