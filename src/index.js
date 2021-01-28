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
import { setProgressStatus } from "./ui.js";
import { setupInstance, teardownInstance } from "./runtime.js";

let args = [];
let wasmInstance;

async function main() {
	// Initialize the runtime
	wasmInstance = await wasmModule({
		// Let setupInstance() do work before calling wasm main()
		noInitialRun: true,

		canvas: document.getElementById("canvas"),

		// Runs after initializing the runtime
		onRuntimeInitialized: function() {
			setupInstance(this, args);
		},

		onExit: function(status) {
			teardownInstance(this);
		},

		setStatus: function (msg) {
			setProgressStatus(msg);
		}
	});
}

window.addEventListener("load", main, { once: true });
