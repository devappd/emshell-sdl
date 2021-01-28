// emshell-sdl - compile.js
// Manage the Emscripten SDK and compile the user's program.
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

const PythonShell = require("python-shell").PythonShell;
const simpleGit = require("simple-git");
const emscripten = require("emscripten-build");
const emsdk = require("emscripten-sdk-npm");
const path = require("path");
const fs = require("fs");

function getEmscriptenRoot() {
    const emsdkPath = emsdk.getEmsdkPath();
    const emscriptenConfPath = path.join(emsdkPath, ".emscripten");
    const defaultEmscriptenRoot = path.join(emsdkPath, "upstream", "emscripten");

    try {
        let emscriptenConf = fs.readFileSync(emscriptenConfPath, { encoding: "utf-8" });

        // Patch out NoneType error under Python 3.x
        emscriptenConf = `
${emscriptenConf.replace("(os.environ.get('EM_CONFIG'))", "(os.environ.get('EM_CONFIG') or os.getcwd()+os.path.sep+'_')")}

print(EMSCRIPTEN_ROOT)
`;

        return new Promise((resolve, reject) => {
            PythonShell.runString(emscriptenConf, { cwd: emsdkPath }, function(err, out) {
                if (err)
                    return reject(err);
                if (!out.length)
                    return reject("Invalid output from emshell.getEmscriptenRoot().");
                resolve(out[0]);
            });
        });
    } catch(e) {
        // Give up and hope this is correct
        return defaultEmscriptenRoot;
    }
}

async function checkoutEmscriptenBranches({
    remoteUrl = "https://github.com/devappd/emscripten.git",
    remoteName = "_emshell",
    baseBranch = null,
    mergeBranches = [
        "ports-sdl2-emshell-rollup-ver0",
        "ports-sdl2-mixer-html5"
    ]
} = {}) {
    // Nothing to do if we don't specify any branches
    if (!baseBranch && (!mergeBranches || !mergeBranches.length))
        return;

    if (!remoteName)
        throw new RangeError("Must specify a git remoteName.");

    const emscriptenRoot = await getEmscriptenRoot();

    if (!fs.existsSync(emscriptenRoot))
        throw new Error(`Emscripten path ${emscriptenRoot} does not exist!`);

    // The below is equivalent to:
    //
    // cd <emscriptenRoot>
    // git init
    // git remote add <remoteName> <remoteUrl>
    // git fetch <remoteName>
    // git reset --hard <baseBranch>
    // git merge <list-of-branches>

    const git = simpleGit({
        baseDir: emscriptenRoot
    });

    await git.init();
    await git.addRemote(remoteName, remoteUrl)
        // Presume already exists, do nothing.
        // TODO: Throw other errors
        .catch(() => {});
    await git.fetch([remoteName]);

    // TODO: Detect if our baseBranch and mergeBranches are updated
    // from git fetch. If not, then don't reset or merge any branches
    if (!baseBranch)
        baseBranch = JSON.parse(fs.readFileSync(path.join(emscriptenRoot, "emscripten-version.txt")));

    await git.reset('hard', [`${remoteName}/${baseBranch}`]);

    if (mergeBranches) {
        if (typeof mergeBranches === 'string')
            mergeBranches = [mergeBranches];

        if (!Array.isArray(mergeBranches))
            throw new RangeError(`mergeBranches ${mergeBranches} must be an array!`);

        for (const branch of mergeBranches) {
            await git.merge([`${remoteName}/${branch}`]);
        }
    }
}

async function compileApp(buildSettings, sdkSettings) {
	// This implicitly updates EMSDK's local tag cache and installs the
	// requested SDK version if it does not exist on the system.
	const em = await emscripten.configure(buildSettings);

	await checkoutEmscriptenBranches(sdkSettings);

	await em.build();
	await em.install();
}

module.exports = {
    compileApp: compileApp
}
