// emshell-sdl - ui.js
// User interface methods.
//
// Copyright 2021 David Apollo (77db70f775fa0b590889c45371a70a1d23e99869d4565976a5207c11606fb6aa)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { setErrorLog, appendErrorLog } from "./error.js";

let _containerElement = null;
function _getContainerElement() {
	if(!_containerElement) {
		_containerElement = document.getElementById("statusContainer");
	}
	return _containerElement;
}

let _progressElement = null;
function _getProgressElement() {
	if (!_progressElement) {
		_progressElement = document.getElementById("progress");
	}
	return _progressElement;
}

export function setProgress(percent) {
	_getProgressElement().setProgress(percent);
}

export function startIndeterminateProgress() {
	_getProgressElement().startIndeterminateProgress();
}

export function stopIndeterminateProgress() {
	_getProgressElement().stopIndeterminateProgress();
}

export function showProgress() {
	_getContainerElement().classList.add("visible");
}

export function hideProgress() {
	setProgress(100);
	_getContainerElement().classList.remove("visible");
}

export function setProgressByStatusMessage(msg) {
	if (msg && typeof msg === 'string') {
		showProgress();

		if (msg.includes("Downloading data... (") || msg.includes("Please wait... (")) {
			stopIndeterminateProgress();

			const nums = msg.match(/\d+/g).map((val) => parseInt(val));

			if (nums.length == 2) {
				const remaining = nums[0];
				const total = nums[1];
				const percent = remaining / total * 100;

				setProgress(percent);
			}
		} else {
			startIndeterminateProgress();
		}
	} else {
		startIndeterminateProgress();
	}
}

export function setProgressError(message) {
	const containerElement = _getContainerElement();

	if (containerElement.classList.contains("error")) {
		appendErrorLog(message);
		return;
	}

	setErrorLog(message);
	showProgress();
	setProgress(100);

	containerElement.classList.remove("nonInteractive");
	containerElement.classList.add("error");
	containerElement.tabIndex = 0;
}

export function unsetProgressError() {
	const containerElement = _getContainerElement();

	if (!containerElement.classList.contains("error")) {
		return;
	}

	setErrorLog();
	hideProgress();
	
	containerElement.classList.add("nonInteractive");
	containerElement.classList.remove("error");
	containerElement.tabIndex = -1;
	containerElement.blur();
}

export function handleUncaughtError(event) {
    if (event.error) {
        setProgressError(event.error);
    } else {
        setProgressError(_buildMessageFromErrorEvent(event));
    }
}
