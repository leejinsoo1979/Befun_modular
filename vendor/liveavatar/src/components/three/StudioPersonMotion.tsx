'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { MALE_CM_PER_PIXEL, MALE_DROP_CM } from './display/avatarScale';
import maleFeet from './display/male-foot-anchors.json';
import * as THREE from 'three';

import type { AvatarVariant } from './display/avatarStore';

/** One decoder keeps RGB and its foreground mask exactly frame-synchronized. */
export function StudioPersonMotion({ fallback, heelDrop, variant = 'female' }: { fallback: ReactNode; heelDrop: number; variant?: AvatarVariant }) {
  const mesh = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shadowGround = useRef({ value: 0 });
  useFrame(() => {
    if (!mesh.current) return;
    if (variant === 'male') {
      const frame = Math.min(maleFeet.feet.length - 1, Math.floor((videoRef.current?.currentTime ?? 0) * maleFeet.fps));
      mesh.current.position.y = (maleFeet.feet[frame] - 304) * MALE_CM_PER_PIXEL - MALE_DROP_CM;
    }
    shadowGround.current.value = -mesh.current.position.y;
  });
  const [material, setMaterial] = useState<THREE.MeshBasicMaterial | null>(null);
  const [shadow, setShadow] = useState<THREE.MeshDepthMaterial | null>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let disposed = false;
    const video = document.createElement('video');
    videoRef.current = video;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = variant === 'male'
      ? '/three/reference-studio/person/male-motion-packed.mp4?v=1'
      : '/three/reference-studio/person/ivory-linen-motion-packed.mp4?v=alpha-interior-2';
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    // The packed frame is RGB | mask. Keep linear filtering inside each half:
    // sampling x=0.5 otherwise blends the last RGB column into the first mask
    // column, making the transparent billboard's left edge visible.
    const texel = { value: new THREE.Vector2(1, 1) };
    const packedUV = `
      uniform vec2 studioPersonTexel;
      vec2 studioPersonUV(vec2 uv, float halfOffset) {
        vec2 inset = studioPersonTexel * 0.5;
        return clamp(vec2(uv.x * 0.5 + halfOffset, uv.y),
          vec2(halfOffset, 0.0) + inset,
          vec2(halfOffset + 0.5, 1.0) - inset);
      }
    `;
    const motionMaterial = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, alphaTest: 8 / 255,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
    });
    motionMaterial.onBeforeCompile = shader => {
      shader.uniforms.studioPersonTexel = texel;
      shader.fragmentShader = packedUV + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>',
        THREE.ShaderChunk.map_fragment.replace('vMapUv', 'studioPersonUV(vMapUv, 0.0)') +
        '\ndiffuseColor.a *= texture2D(map, studioPersonUV(vMapUv, 0.5)).r;');
    };
    motionMaterial.customProgramCacheKey = () => 'studio-person-packed-alpha-v2-clamped';
    // The visible RGB and shadow silhouette share one frame/decoder.
    // The scene's key light projects this cutout onto real floor/wall geometry.
    const shadowMaterial = new THREE.MeshDepthMaterial({
      map: texture, depthPacking: THREE.RGBADepthPacking,
      alphaTest: 0.5, side: THREE.DoubleSide,
    });
    shadowMaterial.onBeforeCompile = shader => {
      shader.uniforms.studioPersonTexel = texel;
      shader.fragmentShader = packedUV + shader.fragmentShader;
      shader.uniforms.studioPersonGroundY = shadowGround.current;
      // Enlarge only the cast silhouette, anchored at the studio floor.
      // The photographed person and the furniture/light remain unchanged.
      shader.vertexShader = 'uniform float studioPersonGroundY;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
        #include <begin_vertex>
        transformed.x *= 1.10;
        transformed.y = studioPersonGroundY + (transformed.y - studioPersonGroundY) * 1.10;
      `);
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        diffuseColor.a *= texture2D(map, studioPersonUV(vMapUv, 0.5)).r;
      `);
    };
    shadowMaterial.customProgramCacheKey = () => 'studio-person-light-shadow-v4-clamped';
    const ready = () => { if (!disposed) { texel.value.set(1 / video.videoWidth, 1 / video.videoHeight); setMaterial(motionMaterial); setShadow(shadowMaterial); } };
    const failed = () => { if (!disposed) setMaterial(null); };
    const play = () => { void video.play().catch(failed); };
    const visibility = () => { if (document.hidden) video.pause(); else play(); };
    video.addEventListener('playing', ready);
    video.addEventListener('error', failed);
    document.addEventListener('visibilitychange', visibility);
    play();
    return () => {
      disposed = true;
      videoRef.current = null;
      document.removeEventListener('visibilitychange', visibility);
      video.removeEventListener('playing', ready);
      video.removeEventListener('error', failed);
      video.pause();
      video.removeAttribute('src');
      video.load();
      texture.dispose();
      motionMaterial.dispose();
      shadowMaterial.dispose();
    };
  }, [variant]);
  if (!material) return fallback;
  return <group>
    <mesh ref={mesh} key="video-person" position={variant === 'male' ? [0, (maleFeet.feet[0] - 304) * MALE_CM_PER_PIXEL - MALE_DROP_CM, 0] : [-3 * 167 / 1522, 167 / 2 - heelDrop, 0]}
    material={material} customDepthMaterial={shadow ?? undefined} castShadow renderOrder={2} raycast={() => null} userData={{ excludeFromAO: true }}>
    <planeGeometry args={variant === 'male' ? [496 * MALE_CM_PER_PIXEL, 608 * MALE_CM_PER_PIXEL] : [167 * 448 / 672, 167]}/>
  </mesh>
  </group>;
}
