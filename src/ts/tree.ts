import {checkNonUndefined} from '/jslib/js/preconditions.js';
import {EditorsManager} from './classes/editors-manager.js';

/**
 * @typedef {import("./file-manipulations.js").DirectoryWithHandles} DirectoryWithHandles
 */

const MARGIN = 12;

/**
 * @param {DirectoryWithHandles} directory
 */
export function generateTree(directory) {
  const treeEl = checkNonUndefined(document.getElementById('tree'));
  const closeEl = document.createElement('button');
  closeEl.id = 'tree-close-btn';
  closeEl.innerHTML = '&times;';
  closeEl.onclick = () => treeEl.innerHTML = '';

  const treeEls = renderTree(directory, 0);
  // insert close at the begining
  treeEls.splice(0, 0, closeEl);
  treeEl.replaceChildren(...treeEls);
}

/**
 * @param {DirectoryWithHandles} directory
 * @param {number} level
 * @return {HTMLElement[]}
 */
function renderTree(directory, level) {
  const result = [];
  const dirEl = document.createElement('div');
  dirEl.textContent = `[${directory.handle.name}]`;
  dirEl.title = `[${directory.handle.name}]`;
  dirEl.style.marginLeft = `${level * MARGIN}px`;
  dirEl.style.maxWidth = `calc( 100% - ${level * MARGIN}px )`;
  dirEl.classList.add('tree-directory');
  result.push(dirEl);

  for (const file of directory.files) {
    const fileEl = document.createElement('button');
    fileEl.textContent = file.name;
    fileEl.title = file.name;
    fileEl.style.marginLeft = `${(level + 1) * MARGIN}px`;
    fileEl.style.maxWidth = `calc( 100% - ${(level + 1) * MARGIN}px )`;
    fileEl.classList.add('tree-file');
    fileEl.onclick = () => EditorsManager.createEditor(file);
    result.push(fileEl);
  }
  for (const dir of directory.directories) {
    result.push(...renderTree(dir, level + 1));
  }
  return result;
}
