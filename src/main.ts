import './style/main.css'
import {Logger} from './ts/logger';
import {supportsFileSystemAccess} from './ts/file-manipulations';
import {newFileClick, openFileClick, openDirClick, saveFileClick, saveFileAsClick, saveAllClick, keyDown, darkModeChanged, launchQueueEvent, closeEvent} from './ts/html';
import {EditorsManager} from './ts/classes/editors-manager';

function onPageLoad(): Promise<any> {
  if (supportsFileSystemAccess()) {
    createMenu();
  } else {
    Logger.error('Browser does not support file access.');
  }
  EditorsManager.setMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  return Promise.resolve();
}

/**
 * Bind onclick methods for menu elements.
 */
function createMenu() {
  (document.getElementById('menuBtnNew') as HTMLButtonElement).onclick = newFileClick;
  (document.getElementById('menuBtnOpen') as HTMLButtonElement).onclick = openFileClick;
  (document.getElementById('menuBtnOpenDir') as HTMLButtonElement).onclick = openDirClick;
  (document.getElementById('menuBtnSave') as HTMLButtonElement).onclick = saveFileClick;
  (document.getElementById('menuBtnSaveAs') as HTMLButtonElement).onclick = saveFileAsClick;
  (document.getElementById('menuBtnSaveAll') as HTMLButtonElement).onclick = saveAllClick;
}


document.addEventListener('DOMContentLoaded', onPageLoad);
document.addEventListener('DOMContentLoaded', EditorsManager.initializeLanguages);
document.addEventListener('keydown', keyDown);
window.addEventListener('beforeunload', closeEvent);
// Detecting dark/light mode changes.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', darkModeChanged);
// Supporting "open with" requests.
// @ts-ignore
window['launchQueue'].setConsumer(launchQueueEvent);
