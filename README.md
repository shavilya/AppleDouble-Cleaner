# AppleDouble Cleaner

AppleDouble Cleaner is a VS Code extension for macOS folders that accumulate
`._*` AppleDouble metadata sidecars, such as those shown in the reference
screenshot. It also works in VS Code-compatible editors that support the VS
Code extension API.

## What it removes

The extension only moves a file to Trash when all of these are true:

- Its name begins with `._` and has a non-empty name after that prefix.
- It is a regular file, not a directory or symlink.
- A sibling with the corresponding original name exists. For example,
  `._app.py` is eligible only when `app.py` exists.

It does not remove `__pycache__`, `venv`, or other generated files or
directories. Files without a matching original are left alone.

## Automatic cleanup

When activated, the extension scans open workspace folders for matching
sidecars and watches for new files. It also checks for a sidecar when its
original file is created, so either creation order is handled. Cleanup is
limited to the current workspace folders.

Use **AppleDouble Cleaner: Clean Sidecars Now** from the Command Palette to
run another scan. This extension moves eligible files to the operating
system's Trash; it does not permanently delete them.

## Development

```sh
npm install
npm test
```

Press `F5` in VS Code to launch an Extension Development Host and try it on a
test folder.
