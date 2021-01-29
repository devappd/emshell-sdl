// emshell-sdl - emscripten.sample.settings.js
// Example build settings for emscripten-build
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
// This file demonstrates a build configuration that you may pass when calling
// emshell's build() API.
//
// emshell uses the "emscripten-build" NPM package to facilitate building
// projects with Emscripten that support CMake, Makefile, or Autotools.
// "emscripten-build" takes a configuration object where you specify
// your build parameters.
//
// To support emshell's features, you need to pass the following flags
// to the compiler via your makefiles:
//
//   -o module.mjs (this exact filename must be used; .mjs implies "-s EXPORT_ES6=1")
//   -s MODULARIZE=1
//   -s ASYNCIFY=1
//   -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS','IDBFS','JSEvents','GL','callMain']
//
// In the sample below, the parameters above are represented by CMake
// flag variables. THE VARIABLES BELOW ARE NOT IMPLEMENTED BY CMAKE! 
// YOU MUST IMPLEMENT THEM YOURSELF IN YOUR CMAKE SCRIPTS! See this link
// for a sample implementation:
//
//   * https://gist.github.com/devappd/039722ab383a88212c1c7648c04dc84e
//
// To use an "emscripten.settings.js" file with emshell's build() API,
// write a build.js script in your project that consists of:
//
// const emsettings = require('./emscripten.settings.js')
//
// emshell.build({
//   buildSettings: emsettings,
//   /* Other parameters... */  
// }).then( () => { /* ... */ } )
//
// See Also:
// 
//   * emscripten-build README: https://github.com/devappd/emscripten-build#emscripten-build
//   * Build Settings: https://github.com/devappd/emscripten-build/blob/main/docs/Build-Settings.md
//

const path = require('path');

const srcPath = path.join(__dirname, 'src', 'CMakeLists.txt');
const buildPath = path.join(__dirname, '.cache', 'build');
const installPath = path.join(__dirname, '.cache', 'wasm');

module.exports = {
  myProject: {
    type: "cmake",
    emsdkVersion: "2.0.12",
  
    configure: {
      path: srcPath,
      type: "Release",

      definitions: {
        "EMSCRIPTEN": true,
        "OUTPUT_NAME": "module",
        "EMCC_OUTPUT_TYPE": ".mjs",
        "EMCC_MODULARIZE": true,
        "EMCC_ASYNCIFY": true,
        // Escape outermost single quotes due to emscripten-build/emscripten-sdk-npm arguments bug
        "EMCC_EXTRA_EXPORTS": "\\'FS','IDBFS','JSEvents','GL','callMain\\'"
      }
    },
  
    build: {
      path: buildPath
    },
  
    install: {
      path: installPath
    }
  }
};
