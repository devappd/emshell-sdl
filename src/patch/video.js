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
	// Intercept emscripten-ports/SDL2's requests for fullscreen so we may modify the
	// "target" and "deferUntilInEventHandler" behaviors.
	//
	// This is tricky because we don't get access to emscripten_request_fullscreen_strategy().
	// The closest patch vector is JSEvents.deferCall.
	//
	// The call trace is:
	//     * emscripten_request_fullscreen_strategy()
	//     * _emscripten_do_request_fullscreen() (i.e., Module.doRequestFullscreen())
	//     * JSEvents.deferCall(_JSEvents_requestFullscreen, 1 /* priority over pointer lock */, [target, strategy])
	//
	// The patch strategy is:
	//     1. If defer call matches signature for SDL fullscreen, then
	//        a. adjust the target to emContainer and strategy size to "do not modify"
	//        b. execute the defer function with args immediately.
	//        c. Else, pass the call to the original function.

	instance.JSEvents.deferCall = function(predefinedDeferCall) {
		return function(targetFunction, precedence, argsList) {
			const fullscreenSignature = (
				precedence === 1
				&& argsList.length === 2
				&& argsList[0] === document.getElementById("canvas")
				&& 'canvasResolutionScaleMode' in argsList[1]
			);

			// Do not defer fullscreen requests. Pass everything else.
			if (!fullscreenSignature)
				return predefinedDeferCall(targetFunction, precedence, argsList);

			return targetFunction(...argsList);
		}
	}(instance.JSEvents.deferCall);

	// Patch our canvas to redirect fullscreen requests to emContainer
	document.getElementById("canvas").requestFullscreen = function(...args) {
		return document.getElementById("emContainer").requestFullscreen(...args);
	}
}
