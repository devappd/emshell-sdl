// emshell-sdl - serviceWorker.shell.js
// Service worker
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

import { clientsClaim } from 'workbox-core';
import { CacheFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import { setCacheNameDetails } from 'workbox-core';

const separator = '/';
const scriptURL = new URL(serviceWorker.scriptURL);
const scriptDirname = dirname(scriptURL.pathname, separator);
const versionHash = '{{VERSION}}';

// https://stackoverflow.com/a/29939805
function basename(str, sep) {
    return str.substr(str.lastIndexOf(sep) + 1);
}

function dirname(str, sep) {
    return str.substr(0, str.lastIndexOf(sep));
}

// TODO: Template-ize this
setCacheNameDetails({
    prefix: 'emshell',
    suffix: 'v1',
    runtime: 'runtime',
    precache: 'precache'
});

// Allow new service worker to take control immediately upon activation, so we can cache as early as
// possible.
clientsClaim();

addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.type === 'CHECK_ACTIVATION_SAFETY') {
            // Count all tabs that this SW is serving, so that we can tell the client whether it is
            // safe to activate a new SW.
            self.clients.matchAll({
                includeUncontrolled: false,
                type: 'window',
            }).then((clients) => {
                const safe = (clients.length <= 1);
                event.source.postMessage({
                    type: "CHECKED_ACTIVATION_SAFETY",
                    isSafe: safe
                });
            });
        } else if (event.data.type === 'SKIP_WAITING') {
            // Allow a new service worker to activate on-demand, so that the client can get new
            // asset updates without a tab-close/refresh.
            self.skipWaiting();
        } 
    }
});

const versionURLPlugin = {
    requestWillFetch: ({request}) => {
        let url = new URL(request.url);
        url.pathname = scriptDirname + '/' + versionHash + url.pathname.substr(scriptDirname.length);
        return new Request(url, request);
    }
}

// Add version hash to all requests besides those for the base shell (i.e., ignore filenames with "shell").
registerRoute(
    function({url, request, event}) {
        const base = basename(url.pathname, separator);
        return scriptURL.host == url.host
            && !url.pathname.includes('/' + versionHash)
            && (scriptDirname.length == 0 || dirname(url.pathname, separator).startsWith(scriptDirname))
            && base.length > 0
            && !base.includes('shell');
    },
    new CacheFirst({
        plugins: [
            versionURLPlugin
        ]
    })
);
