// emshell-sdl - patch/index.js
// Patch Emscripten module functionality.
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
//
////////////////////////////////////////////////////////////////////////
//
// Patch the Emscripten runtime to resolve bugs.
// Designed around Emscripten v2.0.12
//
// Assumed compiler flags:
//
// -s ASYNCIFY=1
//
// Assumed linker flags:
// 
// -s MODULARIZE=1 -s EXPORT_ES6=1 -s ASYNCIFY=1
// -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS','IDBFS','JSEvents','GL','callMain','Asyncify']

import { patchFullscreenRequests } from "./video.js";
import { patchAlwaysSyncToIDB } from "./fileSystem.js";
import { asyncifyExists } from "./common.js";

////////////////////////////////////////////////////////////////////////
// Asyncify Event Handler Fixes
////////////////////////////////////////////////////////////////////////

let dynCallName, handlerEvt;

function patchAsyncifyWasmEventHandler(instance) {
	// Intercept Emscripten's WASM event handler callbacks so we may properly
	// cancel user input events after processing them.
	//
	// This addresses a bug with ASYNCIFY where event handlers rely on
	// dynCall_iiii()'s return value to determine whether to cancel the
	// event from bubbling. In ASYNCIFY, this return value is never passed.
	//
	// See https://github.com/emscripten-core/emscripten/issues/13320
	//
	// This patch attaches to two locations:
	//     1. The event handler so that the event may be retained for
	//        cancelation within dynCall_iiii().
	//     2. dynCall_iiii() to perform the actual cancelation.
	//
	// The expectation is that dynCall_iiii() is called within the event
	// handler, so we can clear the event reference immediately after
	// the event handler completes.
	//
	// For context, see Module.registerTouchEventCallback().

	if (!asyncifyExists(instance))
		return;

	// Only handle the below once.
	if (dynCallName)
		return;

	// The handlers reference dynCall_iiii() in instance.asm, not
	// instance.dynCall_iiii. We need to patch the former.
	//
	// -O0 will have dynCall_iiii listed in asm. Otherwise, we have to
	// search the keys. We only need to do this once per session.

	if(instance.asm.dynCall_iiii)
		dynCallName = "dynCall_iiii";
	else {
		// The below does not work because instance.dynCall_iiii is a wrapper,
		// not the WASM call invoker itself.
		// for (let asmKey in instance.asm) {
		// 	if (instance.asm[asmKey] === instance.dynCall_iiii) {
		// 		dynCallName = asmKey;
		// 		break;
		// 	}
		// }

		// Does this ever change??? This key is sourced from loading the WASM.
		// I presume that dynCall_iiii() is tied to the WASM identifier "Fh".
		dynCallName = "Fh";
	}

	if (!dynCallName)
		throw new RangeError('Cannot find `dynCall_iiii` in instance!');

	instance.asm[dynCallName] = function(predefinedCall) {
		return function(...args) {
			const result = predefinedCall(...args);

			if (result && handlerEvt)
				handlerEvt.preventDefault();

			return result;
		}
	}(instance.asm[dynCallName]);
}

function patchAsyncifyRegisteredHandler(instance, eventHandler) {
	if (!asyncifyExists(instance))
		return;

	eventHandler.handlerFunc = function(predefinedHandlerFunc) {
		return function(evt) {
			// Set handlerEvt to allow patchAsyncifyWasmEventHandler() to work.
			handlerEvt = evt;
			const result = predefinedHandlerFunc(evt);
			handlerEvt = null;
			return result;
		}
	}(eventHandler.handlerFunc);

	return;
}

////////////////////////////////////////////////////////////////////////
// Event Handler Registration Patch
////////////////////////////////////////////////////////////////////////

function patchEventHandlerRegistration(instance) {
	instance.JSEvents.registerOrRemoveHandler = function(predefinedRegister) {
		return function(eventHandler) {
			// Mutate eventHandler.handlerFunc for Asyncify
			patchAsyncifyRegisteredHandler(instance, eventHandler);

			return predefinedRegister(eventHandler);
		}
	}(instance.JSEvents.registerOrRemoveHandler);
}

////////////////////////////////////////////////////////////////////////
// Entry-point
////////////////////////////////////////////////////////////////////////

function validateInstance(instance) {
	if (!instance)
		throw new RangeError('Module instance is invalid!');

	// patchEventHandlerRegistration(), patchFullscreenRequests()
	if (!instance.JSEvents)
		throw new RangeError(`Module instance does not expose JSEvents! Pass this linker flag to EMCC:

	-s EXTRA_EXPORTED_RUNTIME_METHODS=['JSEvents']

`);

	// patchAsyncifyWasmEventHandler()
	if (!instance.asm)
		throw new RangeError('Instance does not have `asm`!');
}

export function patchEmscriptenEvents(instance) {
	validateInstance(instance);

	patchAsyncifyWasmEventHandler(instance);
	patchEventHandlerRegistration(instance);
	patchFullscreenRequests(instance);
	// TODO: Make globList configurable
	patchAlwaysSyncToIDB(instance, []);
}
