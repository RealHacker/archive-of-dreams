// AssetTracker.js - shared THREE.LoadingManager wiring for the four scene managers.
//
// All four scenes are instantiated at page load, so a story's models and
// textures can still be streaming when the player picks that story.  Each scene
// manager owns a private THREE.LoadingManager; this helper wires it up and
// exposes a small progress record the loading screen polls:
//
//   scene.loadProgress = { loaded, total, ready }
//
// `ready` starts as true (a scene with nothing to load is ready right away),
// flips to false when a batch of assets starts and back to true when the batch
// completes.  That lets the loading screen wait for the scene to settle instead
// of guessing how much is left.
//
// The manager's counters are cumulative across batches, so `base` remembers how
// many items were already finished when the current batch began; the reported
// numbers then always describe the batch that is actually in flight.

(function (global) {
  'use strict';

  function installAssetTracker(scene) {
    const manager = new THREE.LoadingManager();
    const progress = { loaded: 0, total: 0, ready: true };
    let base = 0;

    manager.onStart = function (url, loaded, total) {
      base = loaded || 0;
      progress.loaded = 0;
      progress.total = Math.max(0, (total || 0) - base);
      progress.ready = false;
    };

    manager.onProgress = function (url, loaded, total) {
      progress.loaded = Math.max(0, (loaded || 0) - base);
      progress.total = Math.max(0, (total || 0) - base);
    };

    manager.onLoad = function (url, loaded, total) {
      progress.total = Math.max(0, (total || 0) - base);
      progress.loaded = progress.total;
      progress.ready = true;
    };

    scene.loadingManager = manager;
    scene.loadProgress = progress;
    return manager;
  }

  global.installAssetTracker = installAssetTracker;
})(window);
