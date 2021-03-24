# jupyterlab_recents

![Github Actions Status](https://github.com/NERSC/jupyterlab-recents/workflows/Build/badge.svg)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/NERSC/jupyterlab-recents/main?urlpath=lab)[![Conda Version](https://img.shields.io/conda/vn/conda-forge/jupyterlab-recents.svg)](https://anaconda.org/conda-forge/jupyterlab-recents)

Track recent files and folders.

## Requirements

- JupyterLab >= 3.0

## Install

```bash
pip install "git+https://github.com/NERSC/jupyterlab-recents@v3.0.0#egg=jupyterlab-recents"
```

Or

```bash
conda install jupyterlab-recents
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_recents directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Uninstall

```bash
pip uninstall jupyterlab_recents
```

## Legacy Jupyterlab v1 Support

Via NPM:

```{bash}
jupyter labextension install jupyterlab-recents@1.0.1
```

Or use the tagged 1.0.0 release at:
https://github.com/NERSC/jupyterlab-recents/tree/v1.0.1
