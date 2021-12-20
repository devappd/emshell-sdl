// emshell-sdl - patch/fileSystem.js
// Filesystem logic.
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
// Behavior here is executed as a result of shimming Module.
//
// See patch/index.js to see how the patch functions are integrated
// into Module.

import globToRegExp from "glob-to-regexp";

////////////////////////////////////////////////////////////////////////
// IndexedDB sync
////////////////////////////////////////////////////////////////////////

export function patchAlwaysSyncToIDB(instance, globList) {
	if (!instance || !instance.FS || !globList || !globList.length)
		return;

	if (typeof globList === 'string')
		globList = [globList];

	const regexList = globList.map(function (pattern) {
		// If pattern has no path separator, assume it's a filename matched anywhere
		if (!pattern.includes("/") && !pattern.includes("\\"))
			pattern = `**/${pattern}`;

		return globToRegExp(pattern, {
			globstar: true,
			extended: true
		});
	});

	instance.FS.close = function(predefinedClose) {
		return function(stream) {
			predefinedClose(stream);
			regexList.some((regex) => {
				if (regex.test(stream.path)) {
					// push to IDB
					const pullFromIDB = false;
					instance.FS.syncfs(pullFromIDB, (err) => {
						// TODO: Error handling
						// if (err)
						// 	reject(`FS sync-to-IDB error: ${err}`);
						// else
						// 	resolve();
					});

					// short-circuit rest of loop
					return true;
				}
			});
		}
	}(instance.FS.close);
}

//#if _DEBUG
export function patchFsReadPaths(instance) {
	if (!instance || !instance.FS)
		return;
	
	let readPaths = '';

	window.emshellGetReadPaths = function() {
		return readPaths;
	};

	window.emshellClearReadPaths = function() {
		readPaths = '';
	};

	instance.FS.read = function(predefinedRead) {
		return function(stream, buffer, offset, length, position) {
			readPaths += stream.path + '\n';
			return predefinedRead(stream, buffer, offset, length, position);
		}
	}(instance.FS.read);
}
//#endif
