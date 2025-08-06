import {openFilePicker, openDirectoryPicker} from './file-manipulations';
import {generateTree} from './tree';
import {EditorsManager} from './classes/editors-manager';
import {Logger} from './logger';

const CONFIRM_OPEN_MSG = `The file is (most likely¹) already opened. Please confirm that you want to open it again.


¹) Web application doesn't have access to an absolute file path.
The file that you try to open has the same metadata (name, size,
modification time) as the file that is already opened.
`;

let tabInstructionShown = false;

/**
 * Create new file.
  */
export function newFileClick(): Promise<any> {
  return EditorsManager.createEditor();
}

/**
 * Open file.
  */
export function openFileClick(): Promise<any> {
  return openFilePicker().then((fileHandlers) => openFiles(fileHandlers));
}

/**
 * Open directory.
  */
export function openDirClick(): Promise<any> {
  return openDirectoryPicker()
      .then((result) => generateTree(result));
}

/**
 * Save file.
  */
export function saveFileClick(): Promise<any> {
  return EditorsManager.saveActiveEditor();
}

/**
 * Save file as.
  */
export function saveFileAsClick() : Promise<any> {
  return EditorsManager.saveAsActiveEditor();
}

/**
 * Save all files.
  */
export function saveAllClick(): Promise<any> {
  return EditorsManager.saveAllEditors();
}

/**
 * keyDown event to detect shortcuts.
 */
export function keyDown(event: KeyboardEvent) {
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
 */
export function darkModeChanged(event: MediaQueryListEvent) {
  EditorsManager.setMode(event.matches);
  Logger.warn('Existing editors need to be recreated to use the new mode.');
}

interface LaunchParams {
  files: FileSystemFileHandle[];
}

export function launchQueueEvent(launchParams: LaunchParams): Promise<any> {
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

export function closeEvent(event: BeforeUnloadEvent) {
  if (EditorsManager.isAnyEditorUnsaved()) {
    event.returnValue = `There are unsaved changes. Are you sure you want to exit?`;
  }
}

/**
 * Open file.
 */
function openFiles(fileHandlers: FileSystemFileHandle[]): Promise<any> {
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
