// emshell-sdl - runtime.js
// Methods that govern module initiation.
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

import { patchEmscriptenEvents } from "./patch/index.js";

function onError(err) {
	console.error(err);
}

function onReady(instance, args) {
	// Start the program!
	instance.callMain(args);
}

export function setupInstance(instance, args) {
	if (!instance)
		return Promise.reject("WASM instance is invalid");

	return new Promise((resolve, reject) => {
		// Sync FS from IDB to memory
		if (!instance.FS)
			return resolve();
		
		instance.FS.mount(instance.IDBFS, {}, '/home/web_user');

		instance.FS.syncfs(true, (err) => {
			if (err)
				reject(`FS sync-to-memory error: ${err}`);
			else
				resolve();
		});
	}).then(() => {
        patchEmscriptenEvents(instance);
	}).then(() => {
		onReady(instance, args);
	}).catch((err) => {
		onError(err);
	});
}

export function teardownInstance(instance) {
	if (!instance)
		return Promise.resolve();

	// Close audio renderer
	let audioPromise;
	if (instance.SDL2 && instance.SDL2.audioContext)
		audioPromise = instance.SDL2.audioContext.close();
	else
		audioPromise = Promise.resolve();

	return audioPromise.then(() => {
		// Sync FS from memory to IDB
		return new Promise((resolve, reject) => {
			if (!instance.FS)
				return resolve();
			
			instance.FS.syncfs((err) => {
				if (err)
					reject(`FS sync-to-IDB error: ${err}`);
				else
					resolve();
			});
		});
	}).then(() => {
		if (window)
			window.location.reload();
	}).catch((err) => {
		onError(err);
	});
}
