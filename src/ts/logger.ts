/** Logger class */
export class Logger {

  static readonly bottomBar: HTMLDivElement = document.getElementById('bottom-bar') as HTMLDivElement;

  public static error(msg: string, error: Error|undefined = undefined) {
    console.error(msg);
    Logger.createSelfDestroyingSpan(msg, 0);
    if (error) {
      throw error;
    }
  }

  public static warn(msg: string) {
    console.warn(msg);
    Logger.createSelfDestroyingSpan(msg, 1);
  }

  public static info(msg: string) {
    console.info(msg);
    Logger.createSelfDestroyingSpan(msg, 2, 3);
  }

  static createSelfDestroyingSpan(content: string, priority: 0|1|2, timeout: number = 10): HTMLElement {
    const span = document.createElement('span');
    span.textContent = content;
    span.title = content;
    span.classList.add('bottom-bar-message');
    span.classList.add(`bottom-bar-message-${priority}`);
    setTimeout(() => span.remove(), timeout * 1000);
    Logger.bottomBar.appendChild(span);
    return span;
  }
}
