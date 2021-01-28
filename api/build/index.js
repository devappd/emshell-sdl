// emshell-sdl - build.js
// Entry point for build scripts
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

const compileApi = require('./compile.js');
const packageApi = require('./package.js');
const path = require("path");
const fs = require("fs");

////////////////////////////////////////////////////////////////////////
// CACHE PREP
////////////////////////////////////////////////////////////////////////

function copyFolderSync(from, to) {
	// "recursive" returns silently if the dir already exists
    fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

function prepareCache(cachePath) {
	if (!fs.existsSync(cachePath))
		fs.mkdirSync(cachePath, { recursive: true });

	copyFolderSync(path.join(__dirname, "..", "..", "src"), path.join(cachePath, "src"));
}

////////////////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////////////////

async function build({
	cachePath = path.join(process.cwd(), ".cache"),
	outPath = path.join(process.cwd(), "dist"),
	buildSettings = {},
	sdkSettings = {},
	debug = false
} = {}) {
	prepareCache(cachePath);

	await compileApi.compileApp(buildSettings, sdkSettings);

	await packageApi.packageApp(cachePath, outPath, debug);

	return true;
}

module.exports = build;
