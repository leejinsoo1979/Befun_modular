(function () {
 'use strict';

 // The captured configurator lays out a standard row at 0.41 world units,
 // while its own dimension model labels that row as 38 cm. Measure both
 // endpoints instead of treating the renderer's internal units as metres.
 function create(app, T, floor) {
  let host = app, ground = floor, disposed = false;
  const bounds = new T.Box3(), partBounds = new T.Box3(), floorPosition = new T.Vector3();

  function empty(reason) {
   return {ready: false, factor: 1, nominalHeightCm: null, worldHeight: null,
    frameTopY: null, frameBottomY: null, groundY: null, frameCount: 0,
    cellCount: 0, frontZ: null, backZ: null, reason};
  }

  function measure() {
   if (disposed) return empty('disposed');
   if (!host?.scene?.traverse || !ground?.getWorldPosition) return empty('no-scene');
   const result = empty('no-cells'), cells = new Set(), models = new Set();
   // The original inner-area mesh already points at its owning source cell.
   // Never include that selection mesh itself, the avatar, or scene shadows.
   host.scene.traverse(object => {
    const cell = object.userData?.cell;
    if (cell?.frame && typeof cell.frame.values === 'function' &&
        typeof cell.constructor?.getHeight === 'function') cells.add(cell);
   });
   result.cellCount = cells.size;
   if (!cells.size) return result;

   try {
    result.nominalHeightCm = cells.values().next().value.constructor.getHeight();
   } catch {
    result.reason = 'invalid-nominal-height';
    return result;
   }
   host.scene.updateMatrixWorld(true);
   ground.getWorldPosition(floorPosition);
   result.groundY = floorPosition.y;
   bounds.makeEmpty();

   for (const cell of cells) {
    for (const part of cell.frame.values()) {
     const model = part?.model;
     if (!model?.isObject3D || models.has(model)) continue;
     models.add(model);
     let visible = true;
     for (let object = model; object; object = object.parent) {
      if (!object.visible) {visible = false; break;}
     }
     if (!visible) continue;
     let measured = false;
     // A connector's leg/castor is a child of its model. Include visible
     // descendants, but avoid hidden helper meshes and duplicate parents.
     model.traverseVisible(object => {
      const geometry = object.isMesh && object.geometry;
      if (!geometry?.attributes?.position) return;
      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.boundingBox || geometry.boundingBox.isEmpty()) return;
      partBounds.copy(geometry.boundingBox).applyMatrix4(object.matrixWorld);
      bounds.union(partBounds);
      measured = true;
     });
     if (measured) result.frameCount++;
    }
   }
   if (bounds.isEmpty()) {result.reason = 'no-visible-frame'; return result;}
   result.frameTopY = bounds.max.y;
   result.frameBottomY = bounds.min.y;
   result.frontZ = bounds.max.z;
   result.backZ = bounds.min.z;
   result.worldHeight = bounds.max.y - floorPosition.y;
   if (!Number.isFinite(result.nominalHeightCm) || result.nominalHeightCm <= 0) {
    result.reason = 'invalid-nominal-height';
    return result;
   }
   if (!Number.isFinite(result.worldHeight) || result.worldHeight <= 0) {
    result.reason = 'invalid-world-height';
    return result;
   }
   result.factor = result.worldHeight / (result.nominalHeightCm / 100);
   result.ready = true;
   result.reason = 'ready';
   return result;
  }

  return {measure, dispose() {disposed = true; host = null; ground = null;}};
 }

 window.LiveAvatarCalibration = Object.freeze({create});
})();
