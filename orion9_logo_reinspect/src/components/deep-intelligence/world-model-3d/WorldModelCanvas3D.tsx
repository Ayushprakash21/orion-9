import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  WorldEntity3D,
  WorldRelationship3D,
  DomainCluster3D
} from './WorldModelEngine3D';
import { 
  RotateCcw, Play, Pause, Compass, ShieldAlert,
  Layers, Box, Target, Route as RouteIcon, Maximize2, Minimize2,
  ChevronRight, Sparkles, Activity
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface WorldModelCanvas3DProps {
  entities: WorldEntity3D[];
  relationships: WorldRelationship3D[];
  domainClusters: DomainCluster3D[];
  visualizationMode: 'WORLD' | 'NETWORK' | 'ENTITY';
  onVisualizationModeChange: (mode: 'WORLD' | 'NETWORK' | 'ENTITY') => void;
  selectedEntity: WorldEntity3D | null;
  onSelectEntity: (entity: WorldEntity3D | null) => void;
  hoveredEntity: WorldEntity3D | null;
  onHoverEntity: (entity: WorldEntity3D | null) => void;
  activeGroup: string;
  onSelectGroup: (group: string) => void;
  expandedDomain: string | null;
  onToggleExpandDomain: (domainId: string | null) => void;
  isFlowActive: boolean;
  onToggleFlow: () => void;
  highlightedEntityIds?: Set<string>;
  highlightedRelIds?: Set<string>;
  cameraPresetTrigger?: { preset: string; timestamp: number } | null;
  focusEntityTrigger?: { entityId: string; timestamp: number } | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}

interface ScreenLabel {
  id: string;
  name: string;
  subLabel?: string;
  color: string;
  x: number;
  y: number;
  visible: boolean;
  isHub?: boolean;
  isCore?: boolean;
  entity?: WorldEntity3D;
  cluster?: DomainCluster3D;
}

export const WorldModelCanvas3D: React.FC<WorldModelCanvas3DProps> = ({
  entities,
  relationships,
  domainClusters,
  visualizationMode,
  onVisualizationModeChange,
  selectedEntity,
  onSelectEntity,
  hoveredEntity,
  onHoverEntity,
  activeGroup,
  onSelectGroup,
  expandedDomain,
  onToggleExpandDomain,
  isFlowActive,
  onToggleFlow,
  highlightedEntityIds,
  highlightedRelIds,
  cameraPresetTrigger,
  focusEntityTrigger,
  isFullscreen,
  onToggleFullscreen,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [internalHover, setInternalHover] = useState<WorldEntity3D | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [screenLabels, setScreenLabels] = useState<ScreenLabel[]>([]);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Groups and registries
  const nodeMeshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const interactiveMeshesRef = useRef<THREE.Mesh[]>([]);
  const curveTubesGroupRef = useRef<THREE.Group | null>(null);
  const particlesGroupRef = useRef<THREE.Group | null>(null);
  const coreGroupRef = useRef<THREE.Group | null>(null);
  const selectionHaloRef = useRef<THREE.Mesh | null>(null);

  // Camera lerp animation targets
  const camTargetPosRef = useRef<THREE.Vector3 | null>(null);
  const camTargetLookAtRef = useRef<THREE.Vector3 | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // =========================================================================
  // 1. DETERMINE VISIBLE ENTITIES ACCORDING TO VISUALIZATION MODE & EXPANSION
  // =========================================================================
  const visibleEntities = useMemo(() => {
    if (visualizationMode === 'ENTITY' && selectedEntity) {
      // In ENTITY mode: show selected entity and its direct highlighted neighbors
      return entities.filter(e => 
        e.id === selectedEntity.id || 
        (highlightedEntityIds && highlightedEntityIds.has(e.id)) ||
        e.id === 'ORION_CORE'
      );
    }

    if (visualizationMode === 'NETWORK') {
      // In NETWORK mode: show all entities according to active group filter
      if (activeGroup === 'ALL') return entities;
      return entities.filter(e => e.id === 'ORION_CORE' || e.group === activeGroup || e.archetype === 'DOMAIN_HUB');
    }

    // Default: 'WORLD' DIGITAL TWIN MODE
    // Level 1: Orion Core + Domain Hubs always visible
    // Level 2: Prominent Major Entities (top suppliers, warehouses, active shipments, urgent POs, customers)
    // Level 3: Expanded Domain reveals all its granular member entities
    return entities.filter(e => {
      if (e.id === 'ORION_CORE') return true;
      if (e.archetype === 'DOMAIN_HUB') return true;

      // If this entity's domain is expanded, show all its members
      if (expandedDomain && (e.domainHubId === expandedDomain || e.group === expandedDomain)) {
        return true;
      }

      // If an entity is selected or highlighted, always show it
      if (selectedEntity && e.id === selectedEntity.id) return true;
      if (highlightedEntityIds && highlightedEntityIds.has(e.id)) return true;

      // By default in World view: show Level 2 major entities only
      return e.hierarchyLevel <= 2;
    });
  }, [entities, visualizationMode, selectedEntity, highlightedEntityIds, activeGroup, expandedDomain]);

  const visibleEntityIds = useMemo(() => {
    return new Set(visibleEntities.map(e => e.id));
  }, [visibleEntities]);

  // =========================================================================
  // 2. DETERMINE VISIBLE RELATIONSHIPS (CONTROLLED ARTERIES, NO SPAGHETTI!)
  // =========================================================================
  const visibleRelationships = useMemo(() => {
    if (visualizationMode === 'ENTITY' && selectedEntity) {
      // Show only relationships directly touching the selected entity
      return relationships.filter(rel => 
        rel.sourceId === selectedEntity.id || rel.targetId === selectedEntity.id
      );
    }

    // In Trace Path or Blast Radius mode
    if (highlightedRelIds && highlightedRelIds.size > 0) {
      return relationships.filter(rel => highlightedRelIds.has(rel.id));
    }

    if (selectedEntity) {
      // Highlight direct relationships for the selected entity, plus background highways
      return relationships.filter(rel => 
        rel.sourceId === selectedEntity.id || 
        rel.targetId === selectedEntity.id ||
        rel.isBackbone
      );
    }

    if (visualizationMode === 'NETWORK') {
      // In network mode, show member relationships between visible entities
      return relationships.filter(rel => 
        visibleEntityIds.has(rel.sourceId) && visibleEntityIds.has(rel.targetId)
      );
    }

    // Default in WORLD Digital Twin mode:
    // RENDER ONLY BACKBONE ARTERIAL HIGHWAYS!
    // Plus internal relationships if a domain is expanded
    return relationships.filter(rel => {
      if (rel.isBackbone) return true;

      if (expandedDomain) {
        const src = entities.find(e => e.id === rel.sourceId);
        const tgt = entities.find(e => e.id === rel.targetId);
        if (src && tgt && (src.domainHubId === expandedDomain || tgt.domainHubId === expandedDomain)) {
          return true;
        }
      }

      return false;
    });
  }, [relationships, visualizationMode, selectedEntity, highlightedRelIds, visibleEntityIds, expandedDomain, entities]);

  // =========================================================================
  // 3. INITIALIZE THREE.JS SCENE
  // =========================================================================
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebglError('WebGL is not available in this environment. Falling back to 2D Network view.');
        return;
      }
    } catch (e: any) {
      setWebglError(`WebGL error: ${e?.message || 'Context creation failed'}`);
      return;
    }

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020409');
    scene.fog = new THREE.FogExp2('#020409', 0.0032);
    sceneRef.current = scene;

    // 2. Camera - Slightly elevated 3/4 perspective framing Orion Core & all 5 domains
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 2000);
    camera.position.set(0, 85, 155);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. OrbitControls with strict bounds to prevent flipping or clipping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 380;
    controls.minDistance = 24;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Stay above ground plane
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup - Restrained, clean enterprise lighting
    const ambientLight = new THREE.AmbientLight('#1E293B', 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#00F2FE', 1.4);
    keyLight.position.set(50, 90, 70);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38BDF8', 1.0);
    rimLight.position.set(-60, 60, -50);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight('#00F2FE', 3.0, 140, 1.2);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // 6. Subtle Floor Grid & Radial Rings (Very faint, not a bright neon grid)
    const grid = new THREE.GridHelper(300, 30, '#0F263E', '#061220');
    grid.position.y = -48;
    scene.add(grid);

    const ringsGroup = new THREE.Group();
    ringsGroup.position.y = -47.8;
    ringsGroup.rotation.x = -Math.PI / 2;
    [40, 80, 120, 160].forEach(r => {
      const geo = new THREE.RingGeometry(r - 0.25, r, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: '#0284C7',
        opacity: 0.12,
        transparent: true,
        side: THREE.DoubleSide
      });
      ringsGroup.add(new THREE.Mesh(geo, mat));
    });
    scene.add(ringsGroup);

    // 7. ORION CORE at Origin
    const coreGroup = new THREE.Group();
    coreGroupRef.current = coreGroup;

    // Central luminous sphere
    const coreGeo = new THREE.SphereGeometry(2.6, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: '#00F2FE',
      emissive: '#00F2FE',
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Inner wireframe lattice
    const latticeGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const latticeMat = new THREE.MeshBasicMaterial({
      color: '#38BDF8',
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    coreGroup.add(new THREE.Mesh(latticeGeo, latticeMat));

    // Outer translucent shell
    const shellGeo = new THREE.SphereGeometry(3.8, 24, 24);
    const shellMat = new THREE.MeshStandardMaterial({
      color: '#0284C7',
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.9
    });
    coreGroup.add(new THREE.Mesh(shellGeo, shellMat));

    // Counter-rotating orbital rings
    const ring1Geo = new THREE.TorusGeometry(5.2, 0.09, 8, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: '#00F2FE', transparent: true, opacity: 0.65 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3.2;
    ring1.name = 'core_ring_1';
    coreGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(6.6, 0.07, 8, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: '#38BDF8', transparent: true, opacity: 0.45 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.name = 'core_ring_2';
    coreGroup.add(ring2);

    scene.add(coreGroup);

    // 8. Dynamic Subgroups
    const tubesGroup = new THREE.Group();
    scene.add(tubesGroup);
    curveTubesGroupRef.current = tubesGroup;

    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    particlesGroupRef.current = particlesGroup;

    // Selection Halo
    const haloGeo = new THREE.RingGeometry(2.4, 2.8, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: '#00F2FE',
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.visible = false;
    scene.add(haloMesh);
    selectionHaloRef.current = haloMesh;

    // 9. ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Rotate core orbital rings subtly (no world spin)
      if (coreGroupRef.current && !prefersReducedMotion) {
        const r1 = coreGroupRef.current.getObjectByName('core_ring_1');
        const r2 = coreGroupRef.current.getObjectByName('core_ring_2');
        if (r1) r1.rotation.z = elapsedTime * 0.35;
        if (r2) r2.rotation.x = -elapsedTime * 0.28;

        const pulseScale = 1.0 + Math.sin(elapsedTime * 1.8) * 0.035;
        coreMesh.scale.set(pulseScale, pulseScale, pulseScale);
        coreLight.intensity = 2.8 + Math.sin(elapsedTime * 2.0) * 0.4;
      }

      // Selection Halo look at camera
      if (selectionHaloRef.current && selectionHaloRef.current.visible && cameraRef.current) {
        selectionHaloRef.current.lookAt(cameraRef.current.position);
        const haloPulse = 1.0 + Math.sin(elapsedTime * 3.5) * 0.06;
        selectionHaloRef.current.scale.set(haloPulse, haloPulse, 1);
      }

      // Smooth camera lerp transition
      if (camTargetPosRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(camTargetPosRef.current, 0.07);
        if (camTargetLookAtRef.current) {
          controlsRef.current.target.lerp(camTargetLookAtRef.current, 0.07);
        }
        if (cameraRef.current.position.distanceTo(camTargetPosRef.current) < 0.4) {
          camTargetPosRef.current = null;
          camTargetLookAtRef.current = null;
        }
      }

      controls.update();

      // Animate limited data particles along active arterial paths
      if (particlesGroupRef.current && isFlowActive && !prefersReducedMotion) {
        const children = particlesGroupRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const particle = children[i] as any;
          if (particle && particle.userData && particle.userData.curve) {
            particle.userData.t = (particle.userData.t + delta * particle.userData.speed) % 1.0;
            const pt = particle.userData.curve.getPointAt(particle.userData.t);
            particle.position.copy(pt);
          }
        }
      }

      // Render Three.js Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Update Screen-Space Floating Labels
      if (cameraRef.current && containerRef.current) {
        const cW = containerRef.current.clientWidth;
        const cH = containerRef.current.clientHeight;

        const labelsToProject: ScreenLabel[] = [];

        // Orion Core Label
        const coreScreenPos = new THREE.Vector3(0, 0, 0).project(cameraRef.current);
        if (coreScreenPos.z < 1) {
          labelsToProject.push({
            id: 'ORION_CORE',
            name: 'ORION CORE',
            subLabel: 'SUPPLY CHAIN WORLD MODEL',
            color: '#00F2FE',
            x: ((coreScreenPos.x + 1) / 2) * cW,
            y: ((-coreScreenPos.y + 1) / 2) * cH + 28,
            visible: true,
            isCore: true
          });
        }

        // Domain Hub Labels (Level 1)
        domainClusters.forEach(cluster => {
          const p = cluster.center.clone().project(cameraRef.current!);
          if (p.z < 1) {
            labelsToProject.push({
              id: cluster.id,
              name: cluster.name,
              subLabel: cluster.label,
              color: cluster.color,
              x: ((p.x + 1) / 2) * cW,
              y: ((-p.y + 1) / 2) * cH - 24,
              visible: true,
              isHub: true,
              cluster
            });
          }
        });

        setScreenLabels(labelsToProject);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion, domainClusters, isFlowActive]);

  // =========================================================================
  // 4. BUILD / UPDATE 3D NODES & GEOMETRIES (DISTINCT VISUAL ARCHETYPES)
  // =========================================================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous dynamic entity meshes
    nodeMeshMapRef.current.forEach(obj => {
      scene.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        const mat = (obj as any).material;
        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
        else mat.dispose();
      }
    });
    nodeMeshMapRef.current.clear();
    interactiveMeshesRef.current = [];

    // Archetype Geometries
    const geometries: Record<string, THREE.BufferGeometry> = {
      // DOMAIN HUB: Prominent hexagonal pillar with halo
      DOMAIN_HUB: new THREE.CylinderGeometry(2.6, 3.2, 1.8, 6),
      // SUPPLIER: Sleek small glowing sphere
      SUPPLIER: new THREE.SphereGeometry(1.4, 20, 20),
      // FACTORY: Architectural faceted block
      FACTORY: new THREE.BoxGeometry(2.0, 2.4, 2.0),
      // WAREHOUSE: Architectural solid slab/facility
      WAREHOUSE: new THREE.BoxGeometry(3.0, 1.8, 2.8),
      // MATERIAL/SKU: Stacked compact cubes
      MATERIAL: new THREE.BoxGeometry(1.4, 1.4, 1.4),
      // PURCHASE ORDER: Slim document card / tablet
      PURCHASE_ORDER: new THREE.BoxGeometry(1.6, 2.2, 0.24),
      // SHIPMENT: Directional transport capsule / packet
      SHIPMENT: new THREE.CylinderGeometry(0.8, 0.8, 2.4, 8),
      // CUSTOMER: Distinct destination ring / beacon
      CUSTOMER: new THREE.TorusGeometry(1.6, 0.35, 8, 24),
      // EXCEPTION: Sharp warning beacon (octahedron)
      EXCEPTION: new THREE.OctahedronGeometry(1.5),
      // DECISION: Violet crystalline diamond
      DECISION: new THREE.DodecahedronGeometry(1.4),
      // ACTION: Compact cube
      ACTION: new THREE.BoxGeometry(1.2, 1.2, 1.2)
    };

    visibleEntities.forEach(ent => {
      // ORION Core geometry is already permanently anchored in coreGroup
      if (ent.id === 'ORION_CORE') {
        const coreMesh = coreGroupRef.current?.children[0] as THREE.Mesh;
        if (coreMesh) {
          (coreMesh as any).userData = { entity: ent };
          interactiveMeshesRef.current.push(coreMesh);
          nodeMeshMapRef.current.set(ent.id, coreMesh);
        }
        return;
      }

      const geo = geometries[ent.archetype] || geometries.SUPPLIER;
      const isHighlighted = highlightedEntityIds?.has(ent.id);
      const isSelected = selectedEntity && selectedEntity.id === ent.id;
      const isDimmed = selectedEntity && !isSelected && !isHighlighted;

      const baseColor = new THREE.Color(ent.color);
      const emissiveColor = ent.risk === 'critical' || ent.risk === 'high'
        ? new THREE.Color('#EF4444')
        : ent.risk === 'warning'
        ? new THREE.Color('#F59E0B')
        : baseColor;

      // Create Material
      const isHub = ent.archetype === 'DOMAIN_HUB';
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: emissiveColor,
        emissiveIntensity: isSelected ? 1.0 : isHighlighted ? 0.85 : isHub ? 0.6 : ent.risk === 'critical' ? 0.75 : 0.35,
        roughness: isHub ? 0.15 : 0.3,
        metalness: isHub ? 0.8 : 0.5,
        transparent: true,
        opacity: isDimmed ? 0.12 : isHub ? 0.85 : 0.95
      });

      const mesh = new THREE.Mesh(geo.clone(), mat);
      mesh.position.copy(ent.position);
      mesh.scale.set(ent.scale, ent.scale, ent.scale);

      // Orientation adjustments
      if (ent.archetype === 'SHIPMENT') {
        mesh.rotation.z = Math.PI / 2;
      } else if (ent.archetype === 'CUSTOMER') {
        mesh.rotation.x = Math.PI / 2;
      }

      // Add a subtle floor pedestal ring for Domain Hubs
      if (isHub) {
        const hubRingGeo = new THREE.RingGeometry(3.6, 4.0, 32);
        const hubRingMat = new THREE.MeshBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: isDimmed ? 0.1 : 0.45,
          side: THREE.DoubleSide
        });
        const hubRing = new THREE.Mesh(hubRingGeo, hubRingMat);
        hubRing.rotation.x = -Math.PI / 2;
        hubRing.position.y = -1.2;
        mesh.add(hubRing);
      }

      (mesh as any).userData = { entity: ent };
      scene.add(mesh);
      nodeMeshMapRef.current.set(ent.id, mesh);
      interactiveMeshesRef.current.push(mesh);
    });
  }, [visibleEntities, selectedEntity, highlightedEntityIds]);

  // =========================================================================
  // 5. BUILD / UPDATE 3D RELATIONSHIP TUBES & SMOOTH DATA PARTICLES
  // =========================================================================
  useEffect(() => {
    const tubesGroup = curveTubesGroupRef.current;
    const particlesGroup = particlesGroupRef.current;
    if (!tubesGroup || !particlesGroup) return;

    // Clear previous tubes
    while (tubesGroup.children.length > 0) {
      const child = tubesGroup.children[0] as THREE.Mesh;
      tubesGroup.remove(child);
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material?.dispose();
    }

    // Clear previous particles
    while (particlesGroup.children.length > 0) {
      const child = particlesGroup.children[0] as THREE.Mesh;
      particlesGroup.remove(child);
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material?.dispose();
    }

    const particleGeo = new THREE.SphereGeometry(0.5, 12, 12);

    visibleRelationships.forEach((rel, idx) => {
      const isRelHighlighted = highlightedRelIds?.has(rel.id);
      const isConnectedToSelected = selectedEntity && (rel.sourceId === selectedEntity.id || rel.targetId === selectedEntity.id);
      const isDimmed = selectedEntity && !isRelHighlighted && !isConnectedToSelected;

      // Backbone Highways vs Local Connectors
      const tubeRadius = (isRelHighlighted || isConnectedToSelected) 
        ? 0.35 
        : rel.isBackbone 
        ? 0.26 
        : 0.15;

      const tubeGeo = new THREE.TubeGeometry(rel.curve, 28, tubeRadius, 6, false);
      const relColor = new THREE.Color(rel.color);

      const tubeMat = new THREE.MeshStandardMaterial({
        color: relColor,
        emissive: relColor,
        emissiveIntensity: (isRelHighlighted || isConnectedToSelected) ? 0.9 : rel.isBackbone ? 0.45 : 0.25,
        transparent: true,
        opacity: isDimmed ? 0.08 : (isRelHighlighted || isConnectedToSelected) ? 0.95 : rel.isBackbone ? 0.55 : 0.35,
        roughness: 0.25,
        metalness: 0.6
      });

      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubesGroup.add(tubeMesh);

      // Limited moving particles (Only 1-2 per arterial path, max ~12 total)
      if (isFlowActive && (rel.isBackbone || isConnectedToSelected || isRelHighlighted)) {
        const count = 1; // Strict limit: 1 packet per highway keeps the scene elegant
        for (let p = 0; p < count; p++) {
          const pMat = new THREE.MeshBasicMaterial({
            color: (isRelHighlighted || isConnectedToSelected) ? '#FFFFFF' : relColor,
            transparent: true,
            opacity: isDimmed ? 0.15 : 0.95
          });
          const pMesh = new THREE.Mesh(particleGeo, pMat) as any;
          pMesh.userData = {
            curve: rel.curve,
            speed: 0.18 * rel.flowSpeed,
            t: (idx * 0.13) % 1.0
          };
          const pt = rel.curve.getPointAt(pMesh.userData.t);
          pMesh.position.copy(pt);
          particlesGroup.add(pMesh);
        }
      }
    });
  }, [visibleRelationships, selectedEntity, highlightedRelIds, isFlowActive]);

  // =========================================================================
  // 6. UPDATE SELECTION RETICLE
  // =========================================================================
  useEffect(() => {
    if (!selectionHaloRef.current) return;
    if (selectedEntity) {
      selectionHaloRef.current.position.copy(selectedEntity.position);
      const s = selectedEntity.scale * 1.35;
      selectionHaloRef.current.scale.set(s, s, 1);
      selectionHaloRef.current.visible = true;
    } else {
      selectionHaloRef.current.visible = false;
    }
  }, [selectedEntity]);

  // =========================================================================
  // 7. CAMERA PRESETS & SMOOTH TRANSITIONS
  // =========================================================================
  const triggerCameraTransition = useCallback((pos: THREE.Vector3, lookAt: THREE.Vector3) => {
    camTargetPosRef.current = pos.clone();
    camTargetLookAtRef.current = lookAt.clone();
  }, []);

  // Handle Preset Trigger
  useEffect(() => {
    if (!cameraPresetTrigger) return;
    const { preset } = cameraPresetTrigger;
    switch (preset) {
      case 'WORLD':
        triggerCameraTransition(new THREE.Vector3(0, 85, 155), new THREE.Vector3(0, 0, 0));
        break;
      case 'SUPPLY':
        triggerCameraTransition(new THREE.Vector3(-26, 52, -2), new THREE.Vector3(-26, 34, -32));
        break;
      case 'INVENTORY':
        triggerCameraTransition(new THREE.Vector3(-48, 16, 40), new THREE.Vector3(-48, -6, 10));
        break;
      case 'PROCUREMENT':
        triggerCameraTransition(new THREE.Vector3(36, 46, 12), new THREE.Vector3(36, 26, -18));
        break;
      case 'LOGISTICS':
        triggerCameraTransition(new THREE.Vector3(38, 6, 58), new THREE.Vector3(38, -18, 28));
        break;
      case 'CUSTOMERS':
        triggerCameraTransition(new THREE.Vector3(0, -6, 92), new THREE.Vector3(0, -32, 62));
        break;
      case 'CONTROL':
        triggerCameraTransition(new THREE.Vector3(0, 72, 36), new THREE.Vector3(0, 52, 6));
        break;
      default:
        triggerCameraTransition(new THREE.Vector3(0, 85, 155), new THREE.Vector3(0, 0, 0));
    }
  }, [cameraPresetTrigger, triggerCameraTransition]);

  // Handle Focus Entity Trigger
  useEffect(() => {
    if (!focusEntityTrigger) return;
    const { entityId } = focusEntityTrigger;
    const ent = entities.find(e => e.id === entityId);
    if (ent) {
      const offset = new THREE.Vector3(14, 16, 26);
      triggerCameraTransition(ent.position.clone().add(offset), ent.position);
    }
  }, [focusEntityTrigger, entities, triggerCameraTransition]);

  // =========================================================================
  // 8. RAYCASTING & INTERACTION
  // =========================================================================
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(interactiveMeshesRef.current, true);

    if (intersects.length > 0) {
      // Find top object with userData.entity
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !(obj as any).userData?.entity) {
        obj = obj.parent;
      }

      if (obj && (obj as any).userData?.entity) {
        const ent = (obj as any).userData.entity as WorldEntity3D;
        setInternalHover(ent);
        onHoverEntity(ent);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    setInternalHover(null);
    onHoverEntity(null);
    setTooltipPos(null);
    canvas.style.cursor = 'default';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas || !cameraRef.current) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(interactiveMeshesRef.current, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !(obj as any).userData?.entity) {
        obj = obj.parent;
      }

      if (obj && (obj as any).userData?.entity) {
        const ent = (obj as any).userData.entity as WorldEntity3D;

        // If clicked a Domain Hub: expand that domain and move camera
        if (ent.archetype === 'DOMAIN_HUB') {
          const cluster = domainClusters.find(c => c.id === ent.id);
          if (cluster) {
            onToggleExpandDomain(expandedDomain === cluster.id ? null : cluster.id);
            triggerCameraTransition(cluster.cameraPreset.pos, cluster.cameraPreset.lookAt);
          }
          return;
        }

        // Normal entity selection
        onSelectEntity(ent);
        const offset = new THREE.Vector3(14, 15, 24);
        triggerCameraTransition(ent.position.clone().add(offset), ent.position);
        return;
      }
    }
  };

  const handleResetCamera = () => {
    onSelectEntity(null);
    onToggleExpandDomain(null);
    onSelectGroup('ALL');
    onVisualizationModeChange('WORLD');
    triggerCameraTransition(new THREE.Vector3(0, 85, 155), new THREE.Vector3(0, 0, 0));
  };

  const handleClusterClick = (cluster: DomainCluster3D) => {
    onToggleExpandDomain(expandedDomain === cluster.id ? null : cluster.id);
    onSelectGroup(cluster.group);
    triggerCameraTransition(cluster.cameraPreset.pos, cluster.cameraPreset.lookAt);
  };

  if (webglError) {
    return (
      <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-900 rounded-xl text-center space-y-4 font-mono text-os-text-muted">
        <ShieldAlert size={36} className="text-amber-400 mx-auto" />
        <div className="text-sm font-bold text-os-text-primary uppercase tracking-widest">3D DIGITAL TWIN UNAVAILABLE</div>
        <p className="text-xs text-slate-500 max-w-md">{webglError}</p>
        <button
          onClick={() => onVisualizationModeChange('NETWORK')}
          className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-lg uppercase"
        >
          Switch to 2D Network Mode
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[620px] bg-[#020409] rounded-xl overflow-hidden border border-slate-900 select-none shadow-2xl transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50 h-screen rounded-none border-none",
        className
      )}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full block outline-none touch-none"
      />

      {/* FLOATING 3D SCREEN-SPACE LABELS (ORION CORE & DOMAIN HUBS) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden font-mono z-10">
        {screenLabels.map(label => {
          if (label.isCore) {
            return (
              <div
                key={label.id}
                style={{ left: `${label.x}px`, top: `${label.y}px` }}
                className="absolute -translate-x-1/2 text-center pointer-events-none transition-all duration-75"
              >
                <div className="text-[11px] font-extrabold text-[#00F2FE] tracking-widest drop-shadow-[0_2px_8px_rgba(0,242,254,0.6)]">
                  {label.name}
                </div>
                <div className="text-[8px] text-os-text-muted uppercase tracking-wider font-semibold">
                  {label.subLabel}
                </div>
              </div>
            );
          }

          if (label.isHub && label.cluster) {
            const isExpanded = expandedDomain === label.cluster.id;
            return (
              <div
                key={label.id}
                style={{ left: `${label.x}px`, top: `${label.y}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClusterClick(label.cluster!);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-all duration-150 active:scale-95"
              >
                <div className={cn(
                  "px-3 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-all",
                  isExpanded 
                    ? "bg-slate-900/90 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30" 
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-600 text-os-text-primary hover:bg-slate-900/90"
                )}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    {label.name}
                  </span>
                  <span className="text-[8px] text-os-text-muted font-normal">
                    • {label.subLabel}
                  </span>
                  {label.cluster.riskCount > 0 && (
                    <span className="px-1 text-[8px] font-bold bg-red-500/20 text-red-400 rounded-full">
                      {label.cluster.riskCount}!
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* TOP-LEFT OVERLAY: DIGITAL REALITY ENGINE STATUS */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none font-mono space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-pulse" />
          <span className="text-xs font-bold text-os-text-primary tracking-wider uppercase">
            ORION 9 // DIGITAL REALITY WORLD MODEL
          </span>
          <span className="px-1.5 py-0.2 bg-cyan-950/70 border border-cyan-500/30 text-[#00F2FE] text-[9px] rounded font-bold uppercase">
            {visualizationMode} MODE
          </span>
        </div>
        <div className="text-[10px] text-os-text-muted uppercase tracking-widest flex items-center gap-2">
          <span>5 WORLDS</span>
          <span>•</span>
          <span>{visibleEntities.length} ACTIVE NODES</span>
          <span>•</span>
          <span>{visibleRelationships.length} ARTERIAL FLOWS</span>
        </div>
      </div>

      {/* TOP-RIGHT CONTROLS: 3 MODES + RESET + FULLSCREEN */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 font-mono text-[10px]">
        {/* Visual Mode Selector: WORLD (Default) | NETWORK | ENTITY */}
        <div className="flex items-center bg-slate-950/90 border border-slate-800 p-1 rounded-lg backdrop-blur-md">
          <button
            onClick={() => onVisualizationModeChange('WORLD')}
            className={cn(
              "px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1",
              visualizationMode === 'WORLD'
                ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40"
                : "text-os-text-muted hover:text-os-text-primary"
            )}
            title="Structured 3D Digital Twin with Domain Clusters"
          >
            <Box size={11} />
            <span>WORLD</span>
          </button>
          <button
            onClick={() => onVisualizationModeChange('NETWORK')}
            className={cn(
              "px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1",
              visualizationMode === 'NETWORK'
                ? "bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40"
                : "text-os-text-muted hover:text-os-text-primary"
            )}
            title="Technical Network Topology View"
          >
            <Layers size={11} />
            <span>NETWORK</span>
          </button>
          <button
            onClick={() => {
              if (selectedEntity) onVisualizationModeChange('ENTITY');
            }}
            disabled={!selectedEntity}
            className={cn(
              "px-2.5 py-1 rounded transition-all font-bold flex items-center gap-1",
              visualizationMode === 'ENTITY'
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : !selectedEntity
                ? "text-slate-600 cursor-not-allowed"
                : "text-os-text-muted hover:text-os-text-primary"
            )}
            title={selectedEntity ? "Focus only on selected entity and its direct dependencies" : "Select an entity first"}
          >
            <Target size={11} />
            <span>ENTITY</span>
          </button>
        </div>

        {/* Reset Camera View */}
        <button
          onClick={handleResetCamera}
          className="px-2.5 py-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-cyan-400 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 backdrop-blur-md"
          title="Reset Camera to Overview"
        >
          <RotateCcw size={12} />
          <span className="hidden sm:inline">RESET</span>
        </button>

        {/* Expand / Fullscreen World */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-os-text-secondary hover:text-cyan-400 rounded-lg transition-all shadow-md active:scale-95 backdrop-blur-md"
            title={isFullscreen ? "Exit Fullscreen" : "Expand World (Fullscreen)"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
      </div>

      {/* BOTTOM-LEFT INTERACTION HINT & DOMAIN QUICK SHORTCUTS */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 font-mono text-[9px]">
        <div className="text-slate-500 uppercase flex items-center gap-3 bg-slate-950/80 border border-slate-900 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span>DRAG: Orbit</span>
          <span>•</span>
          <span>RIGHT-DRAG: Pan</span>
          <span>•</span>
          <span>SCROLL: Zoom</span>
          <span>•</span>
          <span>CLICK: Inspect</span>
        </div>

        {expandedDomain && (
          <button
            onClick={() => onToggleExpandDomain(null)}
            className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded-lg flex items-center gap-1 font-bold transition-all hover:bg-cyan-900"
          >
            <span>EXPANDED: {expandedDomain.replace(/^HUB_/, '')}</span>
            <span className="text-[10px] ml-1">✕</span>
          </button>
        )}
      </div>

      {/* BOTTOM-RIGHT DATA FLOW TOGGLE */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 font-mono text-[10px]">
        <button
          onClick={onToggleFlow}
          className={cn(
            "px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all backdrop-blur-md shadow-md",
            isFlowActive
              ? "bg-cyan-950/80 border-cyan-500/40 text-cyan-300"
              : "bg-slate-950/80 border-slate-800 text-slate-500 hover:text-os-text-secondary"
          )}
          title="Toggle Moving Data Packets"
        >
          {isFlowActive ? <Play size={11} className="text-cyan-400 fill-cyan-400" /> : <Pause size={11} />}
          <span>FLOW: {isFlowActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* HOVER TOOLTIP HUD */}
      {internalHover && tooltipPos && (
        <div
          style={{
            left: Math.min(tooltipPos.x + 16, (containerRef.current?.clientWidth || 900) - 270),
            top: Math.min(tooltipPos.y + 16, (containerRef.current?.clientHeight || 600) - 150)
          }}
          className="absolute z-30 pointer-events-none bg-os-surface/95 border border-cyan-500/40 p-3 rounded-lg shadow-2xl backdrop-blur-md w-64 font-mono text-[11px] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-os-border pb-1.5 mb-1.5">
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
              {internalHover.type}
            </span>
            <span className={cn(
              "text-[9px] font-bold uppercase px-1.5 py-0.2 rounded",
              internalHover.risk === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              internalHover.risk === 'high' ? 'bg-red-500/10 text-red-400' :
              internalHover.risk === 'warning' ? 'bg-amber-500/20 text-amber-300' :
              'bg-emerald-500/10 text-emerald-400'
            )}>
              {internalHover.risk}
            </span>
          </div>

          <div className="text-os-text-primary font-bold text-xs truncate mb-1">
            {internalHover.name}
          </div>

          <div className="space-y-1 text-[10px] text-os-text-muted">
            {internalHover.metricLabel && (
              <div className="flex justify-between">
                <span className="text-slate-500">{internalHover.metricLabel}:</span>
                <span className="text-os-text-primary font-bold">{internalHover.metricValue}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">DOMAIN:</span>
              <span className="text-cyan-300 font-bold">{internalHover.group}</span>
            </div>
            {internalHover.openIssuesCount !== undefined && internalHover.openIssuesCount > 0 && (
              <div className="flex justify-between text-red-400 font-bold">
                <span>OPEN VARIANCES:</span>
                <span>{internalHover.openIssuesCount} Flagged</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-[8px] text-slate-500 text-right uppercase">Click to Inspect</div>
        </div>
      )}
    </div>
  );
};
