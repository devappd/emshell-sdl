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

const packageApi = require('./package.js');
const path = require("path");
const fs = require("fs");

////////////////////////////////////////////////////////////////////////
// CACHE PREP
////////////////////////////////////////////////////////////////////////

function copyFolderSync(from, to) {
    fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

function removeAndCreateDirectory(path) {
	if (fs.existsSync(path))
		fs.rmdirSync(path, { recursive: true, force: true });
	fs.mkdirSync(path, { recursive: true });
}

function prepareCache(buildPath, cachePath) {
	if (!fs.existsSync(buildPath))
		throw new Error(`Build directory does not exist: ${buildPath}`);

	// Reset cache on every build, so that we don't retain any deleted files by accident.
	// TODO: Would be nice to make cache updates from src/ and wasm/ incremental, like robocopy.
	removeAndCreateDirectory(cachePath);

	// Populate <cachePath>/wasm with the built Emscripten module. <buildPath>
	// is assumed to contain *.mjs, *.wasm, optionally *.wasm.map, and has
	// no subdirectories.
	const wasmCachePath = path.join(cachePath, "wasm");
	fs.mkdirSync(wasmCachePath);

	copyFolderSync(buildPath, path.join(cachePath, "wasm"));

	// Copy <packageRoot>/src to <cachePath>/src, which allows the emshell source to reference
	// the WASM module in the cachePath
	copyFolderSync(path.join(__dirname, "..", "..", "src"), path.join(cachePath, "src"));
}

////////////////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////////////////

async function package(
	buildPath = path.join(process.cwd(), "bin"),
	assetsPath = path.join(process.cwd(), "assets"),
	cachePath = path.join(process.cwd(), ".cache"),
	outPath = path.join(process.cwd(), "dist"),
	debug = false
) {
	prepareCache(buildPath, cachePath);

	// TODO: Make distibution package generate in temporary location,
	// and then move it to the actual <outPath>
	//
	// const outTempPath = `${outPath}.tmp`;
	// removeAndCreateDirectory(outTempPath);

	removeAndCreateDirectory(outPath);

	await packageApi.packageApp(cachePath, assetsPath, outPath, debug);

	return true;
}

module.exports = package;
