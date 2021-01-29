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
// -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS','IDBFS','JSEvents','GL','callMain']

import { patchFullscreenRequests } from "./video.js";
import { patchAlwaysSyncToIDB } from "./fileSystem.js";

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
}

export function patchEmscriptenEvents(instance) {
	validateInstance(instance);

	patchFullscreenRequests(instance);
	// TODO: Make globList configurable
	patchAlwaysSyncToIDB(instance, []);
}
