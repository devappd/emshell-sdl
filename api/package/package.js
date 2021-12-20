// emshell-sdl - build.js
// Package the user's program into a deployable bundle.
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

const rollup = require('rollup');
const terser = require('rollup-plugin-terser').terser;
const copy = require('rollup-plugin-copy');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

const path = require("path");

////////////////////////////////////////////////////////////////////////
// BUNDLE
////////////////////////////////////////////////////////////////////////

async function packageApp(cachePath, assetsPath, outPath, debug) {
	const cachePathNormalized = path.normalize(path.resolve(cachePath)).replace(/\\/g, '/');
	const assetsPathNormalized = path.normalize(path.resolve(assetsPath)).replace(/\\/g, '/');

	// assume __dirname == <shell>/api/bundle
	const shellRepoPath = path.resolve(path.join(__dirname, "..", ".."));

	const bundle = await rollup.rollup({
		input: path.join(cachePath, "src", "index.js"),
		plugins: [
			nodeResolve({
				rootDir: path.join(shellRepoPath),
				resolveOnly: ['glob-to-regexp'],
				dedupe: ['glob-to-regexp']
			}),

			commonjs({
				// Use regex: https://github.com/rollup/rollup-plugin-commonjs/issues/361
				include: /node_modules/
			}),

			copy({
				targets: [
					{ 
						src: [`${cachePathNormalized}/src/**/*shell*.*`],
						dest: outPath,
						rename: (name, ext) => {
							if (name === "shell" && ext === "html")
								return "index.html";
							return `${name}.${ext}`;
						}
					},
					{
						src: [
							`${cachePathNormalized}/wasm/**/*`,

							// Skip module.mjs: This dependency is already pulled by emshell's index.js
							`!${cachePathNormalized}/wasm/**/module.mjs`
						],
						dest: outPath
					},
					{
						src: [`${assetsPathNormalized}/**/*`],
						dest: outPath
					}
				]
			}),

			// If we're building for production (npm run build
            // instead of npm run dev), minify
            !debug && terser(),
        ]
	});
	await bundle.write({
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: path.join(outPath, "bundle.js")
	});
	await bundle.close();
}

module.exports = {
    packageApp: packageApp
};
