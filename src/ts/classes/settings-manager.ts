import { Settings, SETTINGS_HELP} from "./settings";

export class SettingsManager {

  static settingsEl: HTMLDivElement = document.getElementById('settings') as HTMLDivElement;
  static settingsTableEl: HTMLTableElement = document.getElementById('settingsTable') as HTMLTableElement;

  public static settingsClicked(): Promise<any> {
    if (SettingsManager.settingsEl.style.display == 'none') {
      SettingsManager.initTable();
      SettingsManager.settingsEl.style.display = 'block'
    } else {
      SettingsManager.settingsEl.style.display = 'none'
      SettingsManager.settingsTableEl.innerHTML = '';
    }
    return Promise.resolve();
  }

  private static initTable() {
    const settings = new Settings();
    for (const [key, value] of settings.getAllSettings()) {
      const trEl = document.createElement('tr');
      const tdKeyEl = document.createElement('td');
      const tdValueEl = document.createElement('td');
      const labelEl = document.createElement('span');
      const descriptionEl = document.createElement('span');
      const inputEl = document.createElement('input');

      SettingsManager.settingsTableEl.appendChild(trEl);
      trEl.appendChild(tdKeyEl);
      trEl.appendChild(tdValueEl);
      tdKeyEl.appendChild(labelEl);
      tdKeyEl.appendChild(descriptionEl);
      tdValueEl.appendChild(inputEl);

      labelEl.textContent = key;
      descriptionEl.textContent = SETTINGS_HELP.get(key) || '';

      switch (typeof value) {
        case 'boolean':
          inputEl.type = 'checkbox';
          inputEl.checked = value;
          inputEl.onclick = () => settings.updateSetting(key, inputEl.checked);
          break;
        case 'string':
          inputEl.type = 'text';
          inputEl.value = value;
          inputEl.onchange = () => settings.updateSetting(key, inputEl.value);
          break;
        default:
          throw new Error(`Value type: ${typeof value} is not supported.`);
      }
      
    }
  }


}