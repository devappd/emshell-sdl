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
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { precacheAndRoute } from 'workbox-precaching';

const separator = '/';
const scriptURL = self.location;
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
    requestWillFetch: async ({request}) => {
        const url = new URL(request.url);
        url.pathname = scriptDirname + '/' + versionHash + url.pathname.substr(scriptDirname.length);

        // Note that if the original request is non-CORS, then all non-safe headers get dropped from
        // the new request. This includes `range`, even though the spec says it is safe. Because
        // `range` is dropped, media streaming will not work unless the media element declares its
        // CORS mode explicitly (crossorigin='anonymous' or 'use-credentials')
        //
        // To app devs: if you are attaching non-safe headers to your requests, then you must also
        // specify your CORS mode for those headers to be preserved!
        //
        // Overview: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
        //
        // Simple headers spec: https://fetch.spec.whatwg.org/#simple-header

        return new Request(url, request);
    }
}

const networkRangeRequestPlugin = {
    requestWillFetch: ({request}) => {
        return request;
    }
}

const urlIsSameHostAndRoot = (url) => {
    return scriptURL.host == url.host
        && (scriptDirname.length == 0
            || dirname(url.pathname, separator).startsWith(scriptDirname));
};

const urlIsShell = (url) => {
    // Shell files are at the root path of the index.html
    const base = basename(url.pathname, separator);
    return base.length == 0
        || base.includes('.shell.')
        || base.endsWith('index.html');
};

const urlIsMedia = (url) => {
    const base = basename(url.pathname, separator);

    const suffixes = [
        'mp3',
        'ogg',
        'wav',
        'flac',
        'mp4',
        'm4a',
        'aif',
        'webm',
        'adts',
        'mkv',
        'mka'
    ];

    return suffixes.some((suffix) => {
        return base.endsWith(suffix);
    });
};

const urlIsAlreadyVersioned = (url) => {
    return url.pathname.includes('/' + versionHash);
};

const urlShouldBecomeVersioned = (url) => {
    const base = basename(url.pathname, separator);
    return !urlIsAlreadyVersioned(url)
        && !urlIsShell(url);
};

// Precache shell files so they can work offline. Note that we cannot serve media files from here
// because Workbox's precaching is not asynchronous, and we want to download media files in the
// background.
//
// TODO: Build this list from rollup.

precacheAndRoute([
    {url: '/index.html', revision: versionHash},
    {url: '/progressRing.shell.js', revision: versionHash},
], {
    cleanURLs: false
});

// Special handling for audio/video: turn on range requests when serving from cache, as this is
// required for media streaming. Note that if serving from network, streamed media will NOT be
// cached on runtime because they constitute a HTTP 206 response, and it is not trivial to cache
// partial data. Therefore, to serve from cache, the media already has to exist in cache from, e.g.,
// a pre-cache. (But not workbox's precache, see above comment).
//
// https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av
//
// TODO: Cache a list of media in the background asynchronously.

registerRoute(
    function({url, request, event}) {
        return urlIsSameHostAndRoot(url)
            && urlShouldBecomeVersioned(url)
            && urlIsMedia(url);
    },
    new CacheFirst({
        plugins: [
            versionURLPlugin,
            new CacheableResponsePlugin({statuses: [200]}),
            new RangeRequestsPlugin(),
            networkRangeRequestPlugin
        ]
    })
);


// Add version hash to all requests besides those for the base shell (i.e., ignore filenames with "shell").
registerRoute(
    function({url, request, event}) {
        return urlIsSameHostAndRoot(url)
            && urlShouldBecomeVersioned(url);
    },
    new CacheFirst({
        plugins: [
            versionURLPlugin
        ]
    })
);
