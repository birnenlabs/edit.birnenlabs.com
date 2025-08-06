import {checkNonUndefined} from '/jslib/js/preconditions.js';

/** Logger class */
export class Logger {
  /**
   * @param {string} msg
   * @param {Error} [error]
   */
  static error(msg, error = undefined) {
    console.error(msg);
    Logger.#createSelfDestroyingSpan(msg, 0);
    if (error) {
      throw error;
    }
  }

  /**
   * @param {string} msg
   */
  static warn(msg) {
    console.warn(msg);
    Logger.#createSelfDestroyingSpan(msg, 1);
  }

  /**
   * @param {string} msg
   */
  static info(msg) {
    console.info(msg);
    Logger.#createSelfDestroyingSpan(msg, 2, 3);
  }

  /**
   * @param {string} content
   * @param {0|1|2} [priority]
   * @param {number} [timeout]
   * @return {HTMLElement}
   */
  static #createSelfDestroyingSpan(content, priority, timeout = 10) {
    const span = document.createElement('span');
    span.textContent = content;
    span.title = content;
    span.classList.add('bottom-bar-message');
    span.classList.add(`bottom-bar-message-${priority}`);
    setTimeout(() => span.remove(), timeout * 1000);
    checkNonUndefined(document.getElementById('bottom-bar')).appendChild(span);
    return span;
  }
}
