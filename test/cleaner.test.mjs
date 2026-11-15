import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { cleanSidecar } from '../dist/cleaner.js';

test('moves a paired AppleDouble sidecar to the supplied Trash handler', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'appledouble-cleaner-'));
  try {
    const original = path.join(directory, 'app.py');
    const sidecar = path.join(directory, '._app.py');
    await writeFile(original, 'source');
    await writeFile(sidecar, 'metadata');
    const moved = [];

    assert.equal(await cleanSidecar(sidecar, async (filePath) => moved.push(filePath)), true);
    assert.deepEqual(moved, [sidecar]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('leaves an unpaired AppleDouble file untouched', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'appledouble-cleaner-'));
  try {
    const sidecar = path.join(directory, '._not-yet-created');
    await writeFile(sidecar, 'metadata');
    let trashed = false;

    assert.equal(await cleanSidecar(sidecar, async () => { trashed = true; }), false);
    assert.equal(trashed, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('does not trash directories or ordinary files', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'appledouble-cleaner-'));
  try {
    const sidecarDirectory = path.join(directory, '._folder');
    await mkdir(sidecarDirectory);
    await mkdir(path.join(directory, 'folder'));
    const ordinaryFile = path.join(directory, 'app.py');
    await writeFile(ordinaryFile, 'source');
    let trashed = false;
    const moveToTrash = async () => { trashed = true; };

    assert.equal(await cleanSidecar(sidecarDirectory, moveToTrash), false);
    assert.equal(await cleanSidecar(ordinaryFile, moveToTrash), false);
    assert.equal(trashed, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
