import {openFilePicker, openDirectoryPicker} from './file-manipulations.js';
import {generateTree} from './tree.js';
import {EditorsManager} from './classes/editors-manager.js';
import {Logger} from './logger.js';

const CONFIRM_OPEN_MSG = `The file is (most likely¹) already opened. Please confirm that you want to open it again.


¹) Web application doesn't have access to an absolute file path.
The file that you try to open has the same metadata (name, size,
modification time) as the file that is already opened.
`;

let tabInstructionShown = false;

/**
 * Create new file.
 *
 * @return {Promise<any>}
 */
export function newFileClick() {
  return EditorsManager.createEditor();
}

/**
 * Open file.
 *
 * @return {Promise<any>}
 */
export function openFileClick() {
  return openFilePicker().then((fileHandlers) => openFiles(fileHandlers));
}

/**
 * Open directory.
 *
 * @return {Promise<any>}
 */
export function openDirClick() {
  return openDirectoryPicker()
      .then((result) => generateTree(result));
}

/**
 * Save file.
 *
 * @return {Promise<any>}
 */
export function saveFileClick() {
  return EditorsManager.saveActiveEditor();
}

/**
 * Save file as.
 *
 * @return {Promise<any>}
 */
export function saveFileAsClick() {
  return EditorsManager.saveAsActiveEditor();
}

/**
 * Save all files.
 *
 * @return {Promise<any>}
 */
export function saveAllClick() {
  return EditorsManager.saveAllEditors();
}

/**
 * keyDown event to detect shortcuts.
 *
 * @param {KeyboardEvent} event
 */
export function keyDown(event) {
  if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
    if (!tabInstructionShown && event.code === 'Tab') {
      Logger.warn('Press Esc then Tab to move focus out of the editor instead of indenting.');
      tabInstructionShown = true;
    }
    // Not special key, do nothing.
  } else if (event.ctrlKey && event.code === 'KeyN') {
    event.preventDefault();
    newFileClick();
  } else if (event.ctrlKey && !event.shiftKey && event.code === 'KeyO') {
    event.preventDefault();
    openFileClick();
  } else if (event.ctrlKey && event.shiftKey && event.code === 'KeyO') {
    event.preventDefault();
    openDirClick();
  } else if (event.ctrlKey && event.altKey && !event.shiftKey && event.code === 'KeyS') {
    event.preventDefault();
    saveFileAsClick();
  } else if (event.ctrlKey && event.shiftKey && !event.altKey && event.code === 'KeyS') {
    event.preventDefault();
    saveAllClick();
  } if (event.ctrlKey && event.code === 'KeyS') {
    event.preventDefault();
    saveFileClick();
  } if (event.ctrlKey && event.code === 'KeyW') {
    event.preventDefault();
    EditorsManager.closeActiveEditor();
  }
}

/**
 * Detect dark mode change.
 *
 * @param {MediaQueryListEvent} event
 */
export function darkModeChanged(event) {
  EditorsManager.setMode(event.matches);
  Logger.warn('Existing editors need to be recreated to use the new mode.');
}

/**
 * @typedef {Object} LaunchParams
 *
 * @property {FileSystemHandle[]} files
 *
 */

/**
 * @param {LaunchParams} launchParams
 * @return {Promise<any>}
 */
export function launchQueueEvent(launchParams) {
  if (launchParams.files && launchParams.files.length) {
    /** @type {FileSystemFileHandle[]} */
    // @ts-ignore
    const filesArray = launchParams.files.filter((file) => file instanceof FileSystemFileHandle);
    return openFiles(filesArray);
  } else {
    console.error('No files in event.', launchParams);
    return Promise.resolve();
  }
}

/**
 * @param {BeforeUnloadEvent} event
 */
export function closeEvent(event) {
  if (EditorsManager.isAnyEditorUnsaved()) {
    event.returnValue = `There are unsaved changes. Are you sure you want to exit?`;
  }
}

/**
 * Open file.
 *
 * @param {FileSystemFileHandle[]} fileHandlers
 * @return {Promise<any>}
 */
function openFiles(fileHandlers) {
  if (fileHandlers.length == 1) {
    // When opening one file, let's detect if it wasn't opened already.
    return EditorsManager.getFileIndex(fileHandlers[0])
        .then((fileIndex) => {
          if (fileIndex === -1) {
            return EditorsManager.createEditor(fileHandlers[0]);
          } else {
            return window.confirm(CONFIRM_OPEN_MSG) ?
                   EditorsManager.createEditor(fileHandlers[0]) :
                   EditorsManager.activateEditor(fileIndex);
          }
        });
  } else {
    return Promise.all(fileHandlers.map((handler) => EditorsManager.createEditor(handler)));
  }
}
