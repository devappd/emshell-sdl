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
const jscc = require('rollup-plugin-jscc');
const replace = require('@rollup/plugin-replace');
const { minify } = require('html-minifier');

const fs = require("fs");
const path = require("path");

////////////////////////////////////////////////////////////////////////
// BUNDLE
////////////////////////////////////////////////////////////////////////

function getVersionHash() {
	return new Date().toISOString().replace(/[T\.:\-Z]/g, '');
}

async function packageApp(cachePath, assetsPath, outPath, debug) {
	const cachePathNormalized = path.normalize(path.resolve(cachePath)).replace(/\\/g, '/');
	const assetsPathNormalized = path.normalize(path.resolve(assetsPath)).replace(/\\/g, '/');

	// assume __dirname == <shell>/api/bundle
	const shellRepoPath = path.resolve(path.join(__dirname, "..", ".."));

	const versionHash = getVersionHash();
	const outVersionedPath = path.join(outPath, versionHash);

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
						src: [
							`${cachePathNormalized}/src/**/*.shell.*`,
							`!${cachePathNormalized}/src/serviceWorker.shell.js`
						],
						dest: outPath,
						flatten: false
					},
					{
						src: `${cachePathNormalized}/src/shell.html`,
						dest: outPath,
						rename: 'index.html',

						// Not used yet
						// contents.toString().replace(/{{VERSION}}/g, versionHash)
						transform: !debug ? (contents, filename) => minify(contents.toString(), {
							minifyCSS: true,
							minifyJS: true,
							collapseWhitespace: true,
							caseSensitive: true,
							keepClosingSlash: true,
							removeComments: true
						}) : (contents, filename) => contents
					},
					{
						src: [
							`${cachePathNormalized}/wasm/*`,

							// Skip module.mjs: This dependency is already pulled by the bundle
							`!${cachePathNormalized}/wasm/**/module.mjs`
						],
						dest: outVersionedPath,
						flatten: false
					},

					// Copy assets path if one was specified
					...(
						assetsPathNormalized ? [
							{
								src: `${assetsPathNormalized}/*`,
								dest: outVersionedPath,
								flatten: false
							}
						] : []
					)
				],
			}),

			jscc({
				values: { _DEBUG: debug ? 1 : 0 },
				sourcemap: !!debug
			}),

			// If we're building for production, minify
			!debug && terser(),
        ]
	});
	await bundle.write({
		sourcemap: !!debug ? 'inline' : false,
		format: 'iife',
		name: 'app',
		file: path.join(outVersionedPath, "bundle.js")
	});
	await bundle.close();

	const serviceWorker = await rollup.rollup({
		input: path.join(cachePath, "src", "serviceWorker.shell.js"),
		plugins: [
			nodeResolve({
				rootDir: path.join(shellRepoPath),
				resolveOnly: ['workbox-core', 'workbox-strategies', 'workbox-routing', 'workbox-range-requests', 'workbox-cacheable-response', 'workbox-precaching'],
				dedupe: ['workbox-core', 'workbox-strategies', 'workbox-routing', 'workbox-range-requests', 'workbox-cacheable-response', 'workbox-precaching']
			}),

			commonjs({
				// Use regex: https://github.com/rollup/rollup-plugin-commonjs/issues/361
				include: /node_modules/
			}),

			replace({
				preventAssignment: true,
				delimiters: ['', ''],
				values: {
					'{{VERSION}}': versionHash,
					'process.env.NODE_ENV': debug ? "'debug'" : "'production'"
				}
			}),

			// If we're building for production, minify
			!debug && terser(),
		]
	});
	await serviceWorker.write({
		sourcemap: !!debug,
		format: 'es',
		name: 'serviceWorker',
		file: path.join(outPath, "serviceWorker.shell.js")
	});
	await serviceWorker.close();
}

module.exports = {
    packageApp: packageApp
};
