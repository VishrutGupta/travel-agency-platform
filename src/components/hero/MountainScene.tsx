"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { HeroFallback } from "./HeroFallback";

export const MountainScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. WebGL Support Detection
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
      setHasWebGL(true);
    } catch {
      setHasWebGL(false);
      return;
    }

    if (!containerRef.current) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 2. Three.js Scene Setup
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const skyColor = 0xdde6ed;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, 0.012);

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      200
    );
    camera.position.set(0, 10, 36);
    camera.lookAt(0, 7, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Soft Mountain Dawn / Sunset)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffeedb, 2.2);
    sunLight.position.set(35, 40, 20);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 0.6);
    scene.add(hemiLight);

    // Helper: Create stylized low-poly mountain ridge
    const createMountainRidge = (
      widthSpan: number,
      heightMax: number,
      segmentsX: number,
      segmentsY: number,
      zPos: number,
      color: number,
      seedOffset: number
    ) => {
      const geometry = new THREE.PlaneGeometry(
        widthSpan,
        heightMax,
        segmentsX,
        segmentsY
      );
      const pos = geometry.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);

        // Normalize x from -0.5 to 0.5
        const normX = x / widthSpan;
        // Natural mountain peak curve (taper at edges, higher in varied sections)
        const envelope = Math.cos(normX * Math.PI) * 0.9 + 0.1;

        // Multi-frequency harmonic variation
        const n1 = Math.sin((x + seedOffset) * 0.15) * 4.2;
        const n2 = Math.sin((x + seedOffset * 2) * 0.35) * 2.1;
        const n3 = Math.cos((x - seedOffset) * 0.65) * 1.1;

        if (y > -heightMax * 0.4) {
          const elevation = (heightMax * 0.55 + n1 + n2 + n3) * Math.max(0, envelope);
          pos.setY(i, elevation);
        }
      }

      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, zPos);
      mesh.rotation.x = -0.05; // Slight forward tilt for perspective
      return mesh;
    };

    // Layer 3: Distant Peaks (Light Slate/Snowy, high altitude)
    const distantRidge = createMountainRidge(120, 28, 48, 14, -55, 0x93a5b5, 12.5);
    scene.add(distantRidge);

    // Layer 2: Midground Alpine Ridges (Deep Blue-Gray)
    const midRidge = createMountainRidge(100, 22, 40, 12, -30, 0x485c6d, 35.8);
    scene.add(midRidge);

    // Layer 1: Foreground Crags (Dark Charcoal Slate)
    const foreRidge = createMountainRidge(80, 16, 32, 10, -10, 0x243340, 68.2);
    scene.add(foreRidge);

    // 4. Flowing Atmospheric Clouds
    const cloudGroup = new THREE.Group();
    const cloudCount = 9;
    const clouds: {
      mesh: THREE.Mesh;
      speed: number;
      initX: number;
    }[] = [];

    const cloudGeo = new THREE.SphereGeometry(2.4, 7, 5);
    cloudGeo.scale(2.2, 0.45, 0.9); // Flatten into soft rolling puff

    for (let i = 0; i < cloudCount; i++) {
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.95,
        metalness: 0.0,
        transparent: true,
        opacity: 0.55 + (i % 3) * 0.1,
        depthWrite: false,
      });

      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      // Distribute across depths and heights
      const x = -50 + (i * 12) + (Math.random() * 6 - 3);
      const y = 8 + (i % 4) * 2.5 + Math.random() * 2;
      const z = -40 + (i % 3) * 12 + Math.random() * 4;
      const speed = 0.016 + (i % 3) * 0.008; // Slow, continuous, non-distracting drift

      cloudMesh.position.set(x, y, z);
      const scaleVariation = 0.9 + (i % 4) * 0.35;
      cloudMesh.scale.set(scaleVariation, scaleVariation, scaleVariation);

      cloudGroup.add(cloudMesh);
      clouds.push({ mesh: cloudMesh, speed, initX: x });
    }
    scene.add(cloudGroup);

    // 5. Interactive Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 10;

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = normX;
      mouseY = normY;
      targetCameraX = mouseX * 2.8;
      targetCameraY = 10 + mouseY * 1.4;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // 6. Responsive Resize Handling
    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || 600;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };
    window.addEventListener("resize", onResize);

    // 7. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        // Slow horizontal cloud movement
        for (const cloud of clouds) {
          cloud.mesh.position.x += cloud.speed;
          // Wrap around seamlessly
          if (cloud.mesh.position.x > 62) {
            cloud.mesh.position.x = -62;
          }
        }

        // Camera damping (lerp)
        camera.position.x += (targetCameraX - camera.position.x) * 0.04;
        camera.position.y += (targetCameraY - camera.position.y) * 0.04;
        camera.lookAt(0, 7, 0);

        // Subtle mountain ridge parallax shift
        midRidge.position.x = -camera.position.x * 0.18;
        distantRidge.position.x = -camera.position.x * 0.08;
        foreRidge.position.x = -camera.position.x * 0.35;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Three.js resources
      distantRidge.geometry.dispose();
      (distantRidge.material as THREE.Material).dispose();
      midRidge.geometry.dispose();
      (midRidge.material as THREE.Material).dispose();
      foreRidge.geometry.dispose();
      (foreRidge.material as THREE.Material).dispose();
      cloudGeo.dispose();
      renderer.dispose();
    };
  }, []);

  if (hasWebGL === false) {
    return <HeroFallback />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] sm:h-[640px] lg:h-[720px] overflow-hidden select-none"
      aria-label="3D mountain landscape with flowing clouds"
    />
  );
};

export default MountainScene;
