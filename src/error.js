// emshell-sdl - ui.js
// Error handler.
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

let _errorLog = '';

export function appendErrorLog(message) {
	if (message) {
//#if _DEBUG
        _errorLog += '\n\n---\n\n' + (message.stack ? message.stack : message);
//#else
        _errorLog += '\n\n---\n\n' + message;
//#endif
	}
}

export function setErrorLog(message) {
	_errorLog = '';
	appendErrorLog(message);
}

function _showError(interactive) {
    let tail = '';

    if (interactive) {
        tail = ' To reload the page, tap on the center box.';
    } else {
        tail = ' The page will now refresh.';
    }

    alert(`This application reached an error.${tail}${_errorLog}`);
}

function _buildMessageFromErrorEvent(event) {
    if (event.type === 'error') {
//#if _DEBUG
        return `${event.message}\n    at ${event.filename}:${event.lineno}:${event.colno}`
//#else
        return event.message;
//#endif
    } else {
        return '' + event;
    }
}

export function handleStatusInteraction(event) {
	// The status container should accept no mouse elements until the error class has been added,
	// courtesy of CSS. Therefore, it should be safe to leave this loaded throughout the program.
    
    event.preventDefault();
    event.stopImmediatePropagation();

    _showError(false);
    window.location.reload();

    return false;
}
