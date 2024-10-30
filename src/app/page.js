'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

export default function Home() {
  const containerRef = useRef();
  const sceneRef = useRef();
  const [crowGroup, setCrowGroup] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    sceneRef.current.appendChild(renderer.domElement);

    // Create crow with more detailed geometry
    const loader = new GLTFLoader();
    loader.load('/crowfly.glb', (gltf) => {
      const crowGroup = gltf.scene;
      crowGroup.position.set(0, 2, 0);
      crowGroup.scale.set(0.05, 0.05, 0.05);
      crowGroup.rotation.set(-50, 0, 0);
      scene.add(crowGroup);
      setCrowGroup(crowGroup);

      // Set up the crow animation
      const mixer = new THREE.AnimationMixer(crowGroup);
      const crowAction = mixer.clipAction(gltf.animations[0]);
      crowAction.play();

      // Update the animation loop to include the crow mixer
      const animate = () => {
        requestAnimationFrame(animate);
        mixer.update(0.01);
        earth.rotation.y += 0.001;
        renderer.render(scene, camera);
      };
      animate();
    });

    // Create city buildings
    const createBuildings = (count, spread, heightRange) => {
      const buildingGroup = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const height = Math.random() * heightRange[1] + heightRange[0];
        const width = Math.random() * 0.5 + 0.5;
        const depth = Math.random() * 0.5 + 0.5;
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshPhongMaterial({ 
          color: new THREE.Color(0.3 + Math.random() * 0.2, 0.3 + Math.random() * 0.2, 0.3 + Math.random() * 0.2),
          transparent: true,
          opacity: 1
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        building.position.set(
          Math.random() * spread - spread/2,
          -height/2,
          Math.random() * spread - spread/2
        );
        buildingGroup.add(building);
      }
      return buildingGroup;
    };

    // Create prominent left building for second text
    const createProminentBuilding = () => {
      const buildingGeometry = new THREE.BoxGeometry(2, 8, 2);
      const buildingMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(0.4, 0.4, 0.4),
        transparent: true,
        opacity: 1
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(-8, 35, -2);
      return building;
    };

    const cityNear = createBuildings(20, 20, [2, 5]);
    const cityFar = createBuildings(20, 40, [5, 15]);
    const prominentBuilding = createProminentBuilding();
    scene.add(cityNear);
    scene.add(cityFar);
    scene.add(prominentBuilding);
    cityFar.position.y = 35;

    // Create Earth
    const earthGeometry = new THREE.SphereGeometry(40, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      wireframe: true,
      emissive: 0x112244,
      transparent: true,
      opacity: 1
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, 60, -100);
    earth.scale.set(0.001, 0.001, 0.001);
    scene.add(earth);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Initial camera position
    camera.position.set(0, 3, 5);

    // Animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Crow flight path
    if (crowGroup) {
      tl.to(crowGroup.position, {
        z: -15,
        y: '+=3',
        duration: 10,
        ease: 'power2.inOut',
      });
    }

    // First city reveal
    tl.to(cityNear.children.map((b) => b.position), {
      y: '+=5',
      duration: 8,
      stagger: {
        from: 'random',
        amount: 2,
      },
      ease: 'elastic.out(1, 0.3)',
    }, '-=5');

    // Camera tilt up
    tl.to(camera.position, {
      y: 35,
      z: 15,
      duration: 15,
      ease: 'power2.inOut',
    }, '-=2');

    // Second city reveal with prominent building
    tl.to(cityFar.children.map((b) => b.position), {
      y: '+=10',
      duration: 10,
      stagger: {
        from: 'random',
        amount: 3,
      },
      ease: 'elastic.out(1, 0.3)',
    }, '-=10');

    // Earth reveal
    tl.to(earth.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 10,
      ease: 'power2.in',
    }, '-=5');

    // Fade out everything except Earth
    tl.to([
      ...cityNear.children.map(b => b.material),
      ...cityFar.children.map(b => b.material),
      prominentBuilding.material
    ], {
      opacity: 0,
      duration: 8,
      ease: 'power2.in',
    }, '-=8');

    // Text animations
    gsap.fromTo(
      '.text-section-1',
      { opacity: 0, x: -100 },
      {
        opacity: 1,
        x: 0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: '15% top',
          end: '25% top',
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      '.text-section-2',
      { opacity: 0, x: -100 },
      {
        opacity: 1,
        x: 0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: '45% top',
          end: '55% top',
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      '.text-section-3',
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: '75% top',
          end: '85% top',
          scrub: true,
        },
      }
    );

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      sceneRef.current?.removeChild(renderer.domElement);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      scene.clear();
    };
  }, []);

  return (
    <div className="h-[500vh] relative">
    <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
      <div ref={sceneRef} className="absolute inset-0" />
      
      {/* text container with fixed positioning and higher z-index */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="relative h-full w-full max-w-7xl mx-auto px-4">
          {/* First text section */}
          <div className="text-section-1 opacity-0 absolute left-8 top-1/4 max-w-md">
            <div className="p-6 bg-black/50 backdrop-blur-sm rounded-lg">
              <h2 className="text-4xl mb-4 text-white font-bold">KAKI కాకి </h2>
              <p className="text-white text-xl">A hyper-intelligent landscaping AI, Build your dreams before you build your reality</p>
            </div>
          </div>

          {/* Second text section */}
          <div className="text-section-2 opacity-0 absolute left-8 top-1/2 max-w-md">
            <div className="p-6 bg-black/50 backdrop-blur-sm rounded-lg">
              <h2 className="text-4xl mb-4 text-white font-bold">Disrupt Obstacles</h2>
              <p className="text-white text-xl">Fix problems before they become obstacles. With Kaki, intelligently manage your plots and constructions.</p>
            </div>
          </div>

          {/* Third text section */}
          <div className="text-section-3 opacity-0 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md">
            <div className="p-6 bg-black/50 backdrop-blur-sm rounded-lg text-center">
              <h2 className="text-4xl mb-4 text-white font-bold">Achieve Excelence</h2>
              <p className="text-white text-xl">Get real time updates on the Map, be it elections, possible hazards, predict mishaps and tackle the God of Mischief himself.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div ref={containerRef} className="absolute top-0 left-0 w-full h-full" />
  </div>
  );
}