import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AdminEarthGlobe3DProps {
  className?: string;
  size?: number;
}

export const AdminEarthGlobe3D: React.FC<AdminEarthGlobe3DProps> = ({
  className = '',
  size = 160,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const initialW = container.clientWidth > 50 ? container.clientWidth : size;
    const initialH = container.clientHeight > 50 ? container.clientHeight : size;

    // 1. Three.js Scene & Perspective Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, initialW / initialH, 0.1, 1000);
    camera.position.z = 2.65;

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = `${initialW}px`;
    renderer.domElement.style.height = `${initialH}px`;
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // 3. Texture Loader for Real NASA Satellite Earth Maps
    const textureLoader = new THREE.TextureLoader();

    // Day Map: Real NASA Blue Marble daytime satellite texture
    const dayMap = textureLoader.load('/textures/earth/earth-day.jpg');
    // Normal Map: Real Earth topography & bathymetry relief
    const normalMap = textureLoader.load('/textures/earth_normal_2048.jpg');
    // Specular Map: Ocean reflection gloss
    const specularMap = textureLoader.load('/textures/earth_specular_2048.jpg');
    // Cloud Map: Real NASA satellite clouds
    const cloudsMap = textureLoader.load('/textures/earth/earth-clouds.png');

    // 4. Lighting Setup (Simulating Sun & Deep Space Ambient)
    // Soft deep space ambient luminescence
    const ambientLight = new THREE.AmbientLight(0x112233, 1.4);
    scene.add(ambientLight);

    // Primary Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(4.0, 2.2, 3.8);
    scene.add(sunLight);

    // Secondary Cyan Atmospheric Edge Light (Earthshine)
    const rimLight = new THREE.DirectionalLight(0x00f2fe, 1.4);
    rimLight.position.set(-3.5, 1.0, -2.5);
    scene.add(rimLight);

    // 5. Planetary Body Group (Axial Tilt: 23.4°)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = THREE.MathUtils.degToRad(23.4);
    globeGroup.rotation.x = THREE.MathUtils.degToRad(12);
    scene.add(globeGroup);

    // 6. Real Earth Sphere Mesh
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: dayMap,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      specularMap: specularMap,
      specular: new THREE.Color(0x38bdf8),
      shininess: 28,
      emissive: new THREE.Color(0x041324),
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.35,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 7. Real Clouds Sphere Layer
    const cloudGeo = new THREE.SphereGeometry(1.018, 48, 48);
    const cloudMat = new THREE.MeshLambertMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);

    // 8. Subtle Cyan Atmospheric Edge Glow
    const atmoGeo = new THREE.SphereGeometry(1.06, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // Secondary wider atmospheric halo for soft bloom
    const haloGeo = new THREE.SphereGeometry(1.12, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // Inner subtle cyan haze
    const hazeGeo = new THREE.SphereGeometry(1.025, 36, 36);
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
    globeGroup.add(hazeMesh);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: rw, height: rh } = entry.contentRect;
        if (rw > 50 && rh > 50) {
          camera.aspect = rw / rh;
          camera.updateProjectionMatrix();
          renderer.setSize(rw, rh);
          renderer.domElement.style.width = `${rw}px`;
          renderer.domElement.style.height = `${rh}px`;
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Smooth Rotation Loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earthMesh.rotation.y += 0.0018; // Natural planetary rotation
      cloudMesh.rotation.y += 0.0025; // Clouds drift slightly faster
      renderer.render(scene, camera);
    };
    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      hazeGeo.dispose();
      hazeMat.dispose();
      dayMap.dispose();
      normalMap.dispose();
      specularMap.dispose();
      cloudsMap.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        flexShrink: 0,
      }}
      className={`relative flex items-center justify-center rounded-full overflow-hidden ${className}`}
    />
  );
};
