import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import Stats from 'three/examples/jsm/libs/stats.module';

import { CSG } from '../three/CSGMesh';

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75, // fov
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near
    1000 // far
  );
  camera.position.z = 2;

  camera.position.y = 1;
  camera.position.x = -0.2;

  return camera;
}

function createCube(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    // wireframe: true,
  });

  const cube = new THREE.Mesh(geometry, material);

  return cube;
}

function createLights(): THREE.SpotLight[] {
  const light1 = new THREE.SpotLight();
  light1.position.set(2.5, 5, 5);
  light1.angle = Math.PI / 4;
  light1.penumbra = 0.5;
  light1.castShadow = true;
  light1.shadow.mapSize.width = 1024;
  light1.shadow.mapSize.height = 1024;
  light1.shadow.camera.near = 0.5;
  light1.shadow.camera.far = 20;

  const light2 = new THREE.SpotLight();
  light2.position.set(-2.5, 5, 5);
  light2.angle = Math.PI / 4;
  light2.penumbra = 0.5;
  light2.castShadow = true;
  light2.shadow.mapSize.width = 1024;
  light2.shadow.mapSize.height = 1024;
  light2.shadow.camera.near = 0.5;
  light2.shadow.camera.far = 20;

  return [light1, light2];
}

function Scene(): JSX.Element {
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const threeScene = new THREE.Scene();

    const camera = createCamera();

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    sceneContainerRef.current.appendChild(renderer.domElement);

    // const stats = Stats();
    // sceneContainerRef.current.appendChild(stats.dom);
    // document.body.appendChild(stats.dom)

    // const controls = new OrbitControls(camera, renderer.domElement);

    // const cube = createCube();
    // threeScene.add(cube);


    // Create a cube and sphere and intersect them.
    const cubeMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    const sphereMesh = new THREE.Mesh(
      // new THREE.SphereGeometry(1.45, 8, 8),
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x0000ff })
    );
    cubeMesh.position.set(-5, 0, -6);
    threeScene.add(cubeMesh);
    sphereMesh.position.set(-2, 0, -6);
    threeScene.add(sphereMesh);

    const cubeCSG = CSG.fromMesh(cubeMesh);
    const sphereCSG = CSG.fromMesh(sphereMesh);

    const cubeSphereIntersectCSG = cubeCSG.intersect(sphereCSG);
    const cubeSphereIntersectMesh = CSG.toMesh(
        cubeSphereIntersectCSG,
        new THREE.Matrix4()
    );

    cubeSphereIntersectMesh.material = new THREE.MeshPhongMaterial({
        color: 0xff00ff
    });
    cubeSphereIntersectMesh.position.set(-2.5, 0, -3);
    threeScene.add(cubeSphereIntersectMesh);


    const lights = createLights();
    lights.map((light) => threeScene.add(light));

    function render() {
      renderer.render(threeScene, camera);
    }

    let animationLoop: number | null;
    function animate() {
      animationLoop = requestAnimationFrame(animate);

      // cube.rotation.x += 0.01;
      // cube.rotation.y += 0.01;

      // controls.update();

      render();

      // stats.update();
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
        renderer.dispose();
        animationLoop = null;
      }
    };
  }, []);

  return <div ref={sceneContainerRef} />;
}

export { Scene };
