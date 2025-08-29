export const SETTINGS_HELP = new Map<string, string>([
  ['forceDarkMode', 'By default dark mode will be set based on the browser\'s color-scheme.']
]);

export class Settings {
  readonly wrapLines: boolean = true;
  readonly forceDarkMode: boolean = false;

  constructor() {
    for (const key of Object.keys(this)) {
      const savedValue = localStorage.getItem(key);
      switch (typeof (this as any)[key]) {
        case 'boolean':
          // Do optimise code by moving this if outside case - we need to always
          // iterate over all cases to make sure that error is thrown for unknown
          // unsupported types.
          if (savedValue) {
            (this as any)[key] = savedValue === 'true';
          }
          break;
        case 'string':
          // Same here
          if (savedValue) {
            (this as any)[key] = savedValue;
          }
          break;
        default:
          throw new Error(`Value type: ${typeof (this as any)[key]} is not supported.`);
      }

      console.log(`${key}: ${(this as any)[key]}${savedValue ? '' : ' [default]'}`);
    }
  }

  public getAllSettings(): Map<string, any> {
    const result = new Map<string, any>();
    for (const key of Object.keys(this)) {
      result.set(key, (this as any)[key]);
    }
    return result;
  }

  public updateSetting(key: string, value: string | boolean) {
    if (!(key in this) || typeof (this as any)[key] !== typeof value) {
      throw new Error(`Setting of ${key}:${typeof value} does not exist.`);
    }
    (this as any)[key] = value;
    localStorage.setItem(key, value.toString());
  }
}