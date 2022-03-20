import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75, // fov
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near
    1000 // far
  );
  camera.position.z = 2;

  return camera;
}

function createCube(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });

  const cube = new THREE.Mesh(geometry, material);

  return cube;
}

function Scene(): JSX.Element {
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const threeScene = new THREE.Scene();

    const camera = createCamera();

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    sceneContainerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const cube = createCube();
    threeScene.add(cube);

    function render() {
      renderer.render(threeScene, camera);
    }

    let animationLoop: number | null;
    function animate() {
      animationLoop = requestAnimationFrame(animate);

      // cube.rotation.x += 0.01;
      // cube.rotation.y += 0.01;

      controls.update();

      render();
    }

    // Start the loop.
    animate();

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

      // Might not need this extra render.
      render();
    }

    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('resize', onWindowResize);
      if (animationLoop !== null) {
        cancelAnimationFrame(animationLoop);
        animationLoop = null;
      }
    };
  }, []);

  return <div ref={sceneContainerRef} />;
}

export { Scene };
