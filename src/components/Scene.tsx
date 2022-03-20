import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import Stats from 'three/examples/jsm/libs/stats.module';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

import { CSG } from '../three/CSGMesh';

const diceThrowVelocity = 15;
const diceRotationRandomness = 1;
// const gravity = -9.82; // m/s
const gravity = -9.82 * 2; // m/s

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75, // fov
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near
    1000 // far
  );
  camera.position.z = 10;

  camera.position.y = 1;
  // camera.position.x = -0.2;

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

function createCSGMeshExample(): THREE.Mesh[] {
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
    sphereMesh.position.set(-2, 0, -6);

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

    return [cubeMesh, sphereMesh, cubeSphereIntersectMesh];
}

function createLights(): THREE.Light[] {
  const lights: THREE.Light[] = [];

  const light1 = new THREE.SpotLight();
  light1.position.set(2.5, 5, 25);
  light1.angle = Math.PI / 4;
  light1.penumbra = 0.5;
  light1.castShadow = true;
  light1.shadow.mapSize.width = 1024;
  light1.shadow.mapSize.height = 1024;
  light1.shadow.camera.near = 0.5;
  light1.shadow.camera.far = 20;
  lights.push(light1);

  const light2 = new THREE.SpotLight();
  light2.position.set(-2.5, 5, 25);
  light2.angle = Math.PI / 4;
  light2.penumbra = 0.5;
  light2.castShadow = true;
  light2.shadow.mapSize.width = 1024;
  light2.shadow.mapSize.height = 1024;
  light2.shadow.camera.near = 0.5;
  light2.shadow.camera.far = 20;
  lights.push(light2);

  // const light3 = new THREE.AmbientLight( 0x404040, 0.5 ); // soft white light
  const light3 = new THREE.AmbientLight( 0x404040, 10 ); // soft white light
  lights.push( light3 );

  return lights; // [light1, light2];
}

function Scene(): JSX.Element {
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const threeScene = new THREE.Scene();

    // threeScene.add(new THREE.AxesHelper(5))


    // Setup our world.
    const world = new CANNON.World();
    // world.gravity.set(0, -9.82, 0); // m/s²
    world.gravity.set(0, gravity, 0); // m/s²

    // world.gravity.set(0, 0, -9.82); // m/s²
    // world.gravity.set(0, -9.82, 0); // m/s²
    // world.gravity.set(0, -0.05, 0); // m/s²
    // world.gravity.set(-0.01, -0.01, 0.01); // m/s²
    // world.gravity.set(10.01, 5, -40); // m/s²

    // Create a sphere
    // const radius = 1; // m
    // const sphereBody = new CANNON.Body({
    //   mass: 5, // kg
    //   position: new CANNON.Vec3(0, 0, 10), // m
    //   shape: new CANNON.Sphere(radius)
    // });
    // world.addBody(sphereBody);

    // Create a plane
    // const groundBody = new CANNON.Body({
    //   mass: 0 // mass == 0 makes the body static
    // });
    // const groundShape = new CANNON.Plane();
    // groundBody.addShape(groundShape);
    // world.addBody(groundBody);

    // Plane 2.
    const planeShape = new CANNON.Plane();
    const planeBody = new CANNON.Body({ mass: 0 });
    planeBody.addShape(planeShape);
    planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(planeBody);

    // const fixedTimeStep = 1.0 / 60.0; // seconds
    // const maxSubSteps = 3;



    const camera = createCamera();

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // On clear background (remove for real background).
    renderer.setClearColor( 0xffffff, 0);

    sceneContainerRef.current.appendChild(renderer.domElement);

    // const stats = Stats();
    // sceneContainerRef.current.appendChild(stats.dom);
    // document.body.appendChild(stats.dom)

    const controls = new OrbitControls(camera, renderer.domElement);

    // let dice: THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]> | null = null;
    // let dice: THREE.Mesh<any, any> | null = null;
    let dice: any;
    let dice2: any;

    // const phongMaterial = new THREE.MeshPhongMaterial();
    // const planeGeometry = new THREE.PlaneGeometry(25, 25);
    // const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
    // planeMesh.rotateX(-Math.PI / 2)
    // planeMesh.receiveShadow = true
    // threeScene.add(planeMesh)

    // const diceObjFile = 'dice-obj/dice.obj';
    // const diceMtlFile = 'dice-obj/dice.mtl';

    // const diceObjFile = `${(window as any).asset_url ? `${(window as any).asset_url as string}/` : ''}dice.obj`;
    // const diceMtlFile = `${(window as any).asset_url ? `${(window as any).asset_url as string}/` : ''}dice.mtl`;

    const diceObjFile = (window as any).objAssetUrl || 'dice.obj';
    const diceMtlFile = (window as any).mtlAssetUrl || 'dice.mtl';
    // const diceMtlFile = 'dice-obj/dice.mtl';
    // const s3DiceObjFile = 'https://wearwiki.s3.us-east-2.amazonaws.com/dice.obj';
    // const s3DiceMtlFile = 'https://wearwiki.s3.us-east-2.amazonaws.com/dice.mtl';
    // const diceObjFile = 'https://wearwiki.s3.us-east-2.amazonaws.com/dice.obj';
    // const diceMtlFile = 'https://wearwiki.s3.us-east-2.amazonaws.com/dice.mtl';


    const mtlLoader = new MTLLoader();

    const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const diceBody = new CANNON.Body({ mass: 1 });
    diceBody.addShape(diceShape);
    const diceShape2 = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const diceBody2 = new CANNON.Body({ mass: 1 });
    diceBody2.addShape(diceShape2);
    // diceBody.position.x = dice.position.x;
    // diceBody.position.y = dice.position.y;
    // diceBody.position.z = dice.position.z;

    const normalMaterial = new THREE.MeshNormalMaterial();
    // const phongMaterial = new THREE.MeshPhongMaterial()
    
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMesh = new THREE.Mesh(cubeGeometry, normalMaterial);
    cubeMesh.position.x = -3;
    cubeMesh.position.y = 3;
    cubeMesh.castShadow = true;
    // Actual collision model view.
    // threeScene.add(cubeMesh);


    mtlLoader.load(diceMtlFile, (materials) => {
      materials.preload();

      // const loader = new THREE.ObjectLoader();// OBJLoader();
      const objLoader = new OBJLoader();
      objLoader
        .setMaterials(materials)
        .load(diceObjFile, (object: THREE.Group) => {
          // (object.children[0] as THREE.Mesh).material = material
          object.traverse(function (child) {
            if ((child as THREE.Mesh).isMesh) {
              console.log('got a mesh', child);
              // (child as THREE.Mesh).material = material

              // const diceObj = child;
              dice = child;
              dice2 = child.clone();

              // child.scale = 0.5;
              // dice.scale.set(0.5);
              // dice.scale.set(1);
              // dice.position.set(-5, 0, -6);
              // dice.position.set(0, 5, -10);

              dice.position.x = -3;
              dice.position.y = 3;

              dice2.position.x = 3;
              dice2.position.y = 3;

              // TODO: Scale on the model and don't translate on model.
              // dice.scale.set(0.5, 0.5, 0.5);
              // dice.scale.set(0.1, 0.1, 0.1);
              // dice.scale.set(1.11, 1.11, 1.11);

              // dice.
              // dice.position.set(0, 3, -20);

              dice.castShadow = true;
              dice2.castShadow = true;

              // Align physics model with mesh.
              // diceBody.position.x = dice.position.x;
              // diceBody.position.y = dice.position.y;
              // diceBody.position.z = dice.position.z;
              diceBody.position.copy(dice.position);
              diceBody2.position.copy(dice2.position);

              world.addBody(diceBody);
              world.addBody(diceBody2);

              // dice

              // diceObj
            }
          });

          // const diceObj = 

          // scene.add(object);


          threeScene.add(dice2);

          threeScene.add(object);

          console.log('loaded models');
        },
        (xhr: ProgressEvent<EventTarget>) => {
          console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (error: ErrorEvent) => {
          console.log(error)
        }
      )
    });

    const lights = createLights();
    lights.map((light) => threeScene.add(light));

    function render() {
      renderer.render(threeScene, camera);
    }

    // Returns a vector pointing the the diretion the camera is at
    function getShootDirection() {
      const vector = new THREE.Vector3(0, 0, 1)
      vector.unproject(camera)
      const ray = new THREE.Ray(diceBody.position as any, vector.sub(diceBody.position as any).normalize())
      return ray.direction
    }

    function rollDice() {
      const shootDirection = getShootDirection();
      diceBody.velocity.set(
        shootDirection.x * diceThrowVelocity,
        shootDirection.y * diceThrowVelocity,
        shootDirection.z * diceThrowVelocity
      );

      // Move the dice outside the player sphere.
      const outRadius = 1;

      diceBody.position.copy(camera.position as any);
      diceBody2.position.copy(camera.position as any);

      // const offset = 100;
      // diceBody2.position.x -= shootDirection.x * offset;
      // diceBody2.position.y -= shootDirection.y * offset;
      // diceBody2.position.z -= shootDirection.z * offset;
      // diceBody.position.x -= 1;
      // diceBody2.position.x += 1;
      // diceBody.position.y -= 1;
      // diceBody2.position.y += 1;
      // diceBody.position.z -= 1;
      // diceBody2.position.z += 1;
      // diceBody.position.x = camera.position.x;
      // diceBody.position.y = camera.position.y;
      // diceBody.position.z = camera.position.z;

      // diceBody2.position.x = camera.position.x;
      // diceBody2.position.y = camera.position.y;
      // diceBody2.position.z = camera.position.z;

      // Rotate randomly
      diceBody.quaternion.y = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);
      diceBody.quaternion.x = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);
      diceBody.quaternion.z = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);
      diceBody.quaternion.w = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);

      diceBody2.quaternion.y = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);
      diceBody2.quaternion.x = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);
      diceBody2.quaternion.z = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);
      diceBody2.quaternion.w = Math.random() * diceRotationRandomness * (Math.random() > 0.5 ? 1 : -1);

      const x = diceBody.position.x + shootDirection.x * (outRadius * 1.02 + outRadius);
      const y = diceBody.position.y + shootDirection.y * (outRadius * 1.02 + outRadius);
      const z = diceBody.position.z + shootDirection.z * (outRadius * 1.02 + outRadius);

      const offset = 2;
      const x2 = diceBody.position.x + Math.random() + shootDirection.x * offset * (outRadius * 1.02 + outRadius);
      const y2 = diceBody.position.y + Math.random() + shootDirection.y * offset * (outRadius * 1.02 + outRadius);
      const z2 = diceBody.position.z + Math.random() + shootDirection.z * offset * (outRadius * 1.02 + outRadius);
      dice.position.set(x, y, z);
      dice2.position.set(x2, y2, z2);
      diceBody.position.copy(dice.position);
      diceBody2.position.copy(dice2.position);
    }

    window.addEventListener('click', () => {
      if (!controls.enabled) {
        return
      }

      rollDice();
    })

    let animationLoop: number | null;
    // const lastTime: number | null = null;

    // const clock = new THREE.Clock();
    // let delta;

    function animate() {
      animationLoop = requestAnimationFrame(animate);

      // Run the simulation independently of framerate every 1 / 60 ms
      world.fixedStep()
      // or
      // delta = Math.min(clock.getDelta(), 0.1)
      // world.step(delta)

      // if (lastTime !== null){
      //   // const deltaTime = (time - lastTime) / 1000;
      //   // world.step(fixedTimeStep, dt, maxSubSteps);
      // }
      // console.log("Sphere z position: " + sphereBody.position.z);
      // lastTime = time;

      // cube.rotation.x += 0.01;
      // cube.rotation.y += 0.01;

      if (dice) {
        // dice.rotation.x += 0.01;
        // dice.rotation.y += 0.01;
        // dice.rotation.z += 0.01;

        // Copy coordinates from Cannon to Three.js
        dice.position.set(
          diceBody.position.x,
          diceBody.position.y,// dice.position.y, // diceBody.position.y,
          diceBody.position.z// dice.position.z, // diceBody.position.z// dice.position.z // diceBody.position.z
        );
        dice.quaternion.set(
          diceBody.quaternion.x,
          diceBody.quaternion.y,
          diceBody.quaternion.z,
          diceBody.quaternion.w
        );

        dice2.position.copy(
          diceBody2.position
        ); 
        dice2.quaternion.copy(
          diceBody2.quaternion
        );
        // dice2.quaternion.set(
        //   diceBody.quaternion.x,
        //   diceBody.quaternion.y,
        //   diceBody.quaternion.z,
        //   diceBody.quaternion.w
        // );

        cubeMesh.position.copy(
          diceBody.position as any
        ); 
        cubeMesh.quaternion.copy(
          diceBody.quaternion as any
        );
      }

      controls.update();

      render();

      // stats.update();
    }

    controls.enabled = false;

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

    setInterval(function() {
      // TODO: Reset w move.
      rollDice();
    }, 2500);

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
