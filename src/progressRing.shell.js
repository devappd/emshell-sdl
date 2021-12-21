// emshell-sdl - progressRing.shell.js
// A web component that implements a circular progress ring.
//
// Re-used from https://css-tricks.com/building-progress-ring-quickly/
//
// See "The CSS-Tricks License": https://css-tricks.com/license/

class ProgressRing extends HTMLElement {
  constructor() {
    super();
    const stroke = this.getAttribute('stroke');
    const radius = this.getAttribute('radius');
    const normalizedRadius = radius - stroke * 2;
    this._circumference = normalizedRadius * 2 * Math.PI;

    this._root = this.attachShadow({mode: 'open'});
    this._root.innerHTML = `
      <svg
        height="${radius * 2}"
        width="${radius * 2}"
        >
          <circle
            stroke="white"
            stroke-dasharray="${this._circumference} ${this._circumference}"
            style="stroke-dashoffset:${this._circumference}"
            stroke-width="${stroke}"
            fill="transparent"
            r="${normalizedRadius}"
            cx="${radius}"
            cy="${radius}"
        />
      </svg>

      <style>
        circle {
          transition: stroke-dashoffset 0.35s;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
        }
      </style>
    `;
  }

  // private

  _internalChangeAttribute(name, value) {
    this._internalChange = true;
    this.setAttribute(name, value);
    this._internalChange = false;
  }

  _internalRemoveAttribute(name) {
    this._internalChange = true;
    this.removeAttribute(name);
    this._internalChange = false;
  }

  _setProgress(percent) {
    const offset = this._circumference - (percent / 100 * this._circumference);
    const circle = this._root.querySelector('circle');
    circle.style.strokeDashoffset = offset; 
    this._progress = percent;
  }

  // interface

  static get observedAttributes() {
    return ['progress'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._internalChange) {
      return;
    }
    
    if (name === 'progress') {
      this._setProgress(newValue);
    }
  }

  // public

  setProgress(percent) {
    this.stopIndeterminateProgress();
    this._internalChangeAttribute('progress', percent);
    this._setProgress(percent);
  }

  startIndeterminateProgress() {
    if (!this._pulseIndeterminateProgress) { 
      this._pulseIndeterminateProgress = () => {
        this._setProgress((this._progress + 1) % 200);
        this._lastRaf = window.requestAnimationFrame(this._pulseIndeterminateProgress);
      };
    }

    if (!this._lastRaf) {
      this._lastRaf = window.requestAnimationFrame(this._pulseIndeterminateProgress);
      this._internalChangeAttribute('indeterminate', '');
    }
  }

  stopIndeterminateProgress() {
    if (this._lastRaf) {
      window.cancelAnimationFrame(this._lastRaf);
      this._lastRaf = 0;
      this._internalRemoveAttribute('indeterminate');
      this.setProgress(100);
    }
  }
}

window.customElements.define('progress-ring', ProgressRing);
