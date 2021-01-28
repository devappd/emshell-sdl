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

let lastStatus, lastRaf;

export function setProgressStatus(msg) {
	const container = document.getElementById("statusContainer");
	const status = document.getElementById("progress");

	lastStatus = msg;

	function cancelRaf() {
		if (lastRaf) {
			window.cancelAnimationFrame(lastRaf);
			lastRaf = 0;
		}
	}

	if (msg && typeof msg === 'string') {
		container.classList.add("visible");

		if (msg.includes("Downloading data... (") || msg.includes("Please wait... (")) {
			// Set explicit percent on progress bar
			cancelRaf();

			const nums = msg.match(/\d+/g).map((val) => parseInt(val));

			if (nums.length == 2) {
				container.classList.add("visible");
				
				const remaining = nums[0];
				const total = nums[1];
				const percent = remaining / total * 100;

				status.setAttribute("progress", "" + percent);
			}
		} else if (!lastRaf) {
			// Start indeterminate progress bar
			function step() {
				if (lastStatus) {
					const val = parseInt(status.getAttribute("progress"));
					status.setAttribute("progress", "" + ((val + 1) % 200));
					lastRaf = window.requestAnimationFrame(step);
				}
			}
			lastRaf = window.requestAnimationFrame(step);
		}
	} else {
		// Hide progress bar
		cancelRaf();
		status.setAttribute("progress", "100");
		container.classList.remove("visible");
	}
}
