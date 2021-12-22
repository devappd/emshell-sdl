// emshell-sdl - index.js
// Bundle JS entry point.
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

import wasmModule from "../wasm/module.mjs";
import { setProgressByStatusMessage, setProgressError, handleUncaughtError } from "./ui.js";
import { setupInstance, teardownInstance } from "./runtime.js";
import { handleStatusInteraction } from "./error.js";

let args = [];
let wasmInstance;

async function main() {
	// Set event handlers
	window.addEventListener('error', handleUncaughtError, false);

	const statusElement = document.getElementById("statusContainer");

	statusElement.addEventListener("click", handleStatusInteraction, false);
	statusElement.addEventListener("activate", handleStatusInteraction, false);

	// Initialize the runtime
	wasmInstance = await wasmModule({
		// Let setupInstance() do work before calling wasm main()
		noInitialRun: true,

		canvas: document.getElementById("canvas"),

		locateFile: function (path, scriptDirectory) {
			// This function is queried for a URL to the WASM, and to the preload package. The WASM
			// query helpfully supplies the bundle.js's base URL, but the package query does not.
			// Hack the latter case by supplying a path relative to the web page.
			if (!scriptDirectory) {
				scriptDirectory = `${window.versionHash}/`;
			}

			return `${scriptDirectory}${path}`;
		},

		// Runs after initializing the runtime
		onRuntimeInitialized: function() {
			setupInstance(this, args);
		},

		onExit: function(status) {
			teardownInstance(this);
		},

		onAbort: function(msg) {
			setProgressError(msg);
		},

		setStatus: function (msg) {
			setProgressByStatusMessage(msg);
		}
	});
}

window.addEventListener("load", main, { once: true });
