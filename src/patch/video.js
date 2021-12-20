// emshell-sdl - patch/video.js
// Canvas video logic.
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

export function patchFullscreenRequests(instance) {
	// Patch our canvas to redirect fullscreen requests to emContainer
	document.getElementById("canvas").requestFullscreen = function(...args) {
		return document.getElementById("emContainer").requestFullscreen(...args);
	}
}
