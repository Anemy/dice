import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

// The order of the sides matches the model we are currently using.
const sides = ['five', 'three', 'one', 'two', 'six', 'four'] as const;
type FacingSide = typeof sides[number]; // 'one' | 'two' | 'three' | 'four' | 'five' | 'six';

const diceThrowVelocity = 15;
const diceRotationRandomness = 1;
const diceToMake = 2;
const diceScale = 0.5;

// This number indicates how long we wait for the velocities to get to near zero
// before declaring the dice is stable/landed.
// Currently it influences how long until the dice does the loaded swap
// although that could be separated out or done differently.
const stabilizeCheckArrayAmt = 10;

type Die = {
  dieGroup: THREE.Group; // Use a group to group the dots.
  mesh: THREE.Mesh;
  physicsModel: CANNON.Body;
  physicsRenderMesh: THREE.Mesh;
  velocityTotalsForStabilizationCheck: number[];
  intendedFacingSide: FacingSide;
  didRotate?: boolean;
};

/**
 * 
 * Helper code for putting this on shopify and making this script
 * be able to pull the 3d models added to the site:
 * 
 * <!-- RHYS -->
<script type="application/javascript">
   // window.asset_url = "{{ '' | asset_url }}";
   window.objAssetUrl = "{{ 'dice.obj' | asset_url }}";
   window.mtlAssetUrl = "{{ 'dice.mtl' | asset_url }}";
</script>
<div id="root22"></div>
<script src="{{ 'bundle.js' | asset_url }}" defer="defer"></script>

 */

// TODO: Need to calculate which side to push on to make it flip a direction.

// Compute the force vector needed to rotate the die so that the
// intendedFacingSideItem will be pointing up.
function getVelocityVectorToBumpDiceToLoadedFace(die: Die): THREE.Vector3 {
  // TODO: Dedupe this call.
  const facingSide = getTopFacingSideForDie(die);

  const velocityBumpToRotate = 5;

  const quaternion = die.physicsModel.quaternion;

  debugQuaternion(quaternion);

  const currentFacingSideItem = die.dieGroup.children.find(
    child => child.name === facingSide
  );
  const intendedFacingSideItem = die.dieGroup.children.find(
    child => child.name === die.intendedFacingSide
  );
  
  // TODO: Reuse vector to not regenerate.

  const currentTopVector = new THREE.Vector3();
  currentTopVector.setFromMatrixPosition(currentFacingSideItem.matrix);
  currentTopVector.applyQuaternion(die.dieGroup.quaternion);
  currentTopVector.normalize();

  const intendedFaceCurrentVector = new THREE.Vector3();
  intendedFaceCurrentVector.setFromMatrixPosition(intendedFacingSideItem.matrix);
  intendedFaceCurrentVector.applyQuaternion(die.dieGroup.quaternion);
  intendedFaceCurrentVector.normalize();

  const crossProductVector = intendedFaceCurrentVector.clone();
  crossProductVector.cross(currentTopVector);

  crossProductVector.cross(currentTopVector);

  crossProductVector.multiplyScalar(velocityBumpToRotate);

  if (Math.abs(Math.abs(currentTopVector.x) - Math.abs(intendedFaceCurrentVector.x)) < 0.1
    && Math.abs(Math.abs(currentTopVector.z) - Math.abs(intendedFaceCurrentVector.z)) < 0.1
  ) {
    // The side we want the die to be on is opposite so we full flip.
    const directionToSpin = Math.random() > 0.5 ? 1 : -1;

    return new THREE.Vector3(
      2 * directionToSpin,
      5,
      2 * directionToSpin
    );
  }

  return crossProductVector;
}

function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75, // fov
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near
    1000 // far
  );
  camera.position.z = 6; // 7;
  camera.position.y = 7; // 1.5;
  // camera.position.x = -0.2;
  camera.lookAt(0, 0, 0);

  return camera;
}

function createLights(): THREE.Light[] {
  const lights: THREE.Light[] = [];

  // TODO: We could do a lot of different things with lighting here.

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

  // Currently unused.
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
  const light3 = new THREE.AmbientLight(0x404040, 10); // soft white light
  lights.push(light3);

  return lights; // [light1, light2];
}

function debugQuaternion(quaternion: CANNON.Quaternion) {
  console.log('x, y, z, w', quaternion.x, quaternion.y, quaternion.z, quaternion.w); 
}


// This returns the number 1-6 that is facing up based on the die's orientation.
// This is coupled with the initial orientation of the mesh/material.
function getTopFacingSideForDie(die: Die): FacingSide | -1 {  
  let topFacingSide: FacingSide | -1 = -1;
  let topFacingSideYPos = 0;
  const vector = new THREE.Vector3();

  die.dieGroup.children.forEach(dieItem => {
    if (sides.includes(dieItem.name as FacingSide)) {
      // Instead of keeping around meshes and objects for each face on the die
      // we could instead use vector for each side here and apply the die's
      // rotation to compute the upwards facing side. It would be more
      // performant. In this case we're using the dots to help debugging.
      vector.setFromMatrixPosition(dieItem.matrixWorld);

      if (vector.y > topFacingSideYPos) {
        topFacingSide = dieItem.name as FacingSide;
        topFacingSideYPos = vector.y;
      }
    }
  });

  return topFacingSide;
}

// This returns the number 1-6 that is facing up based on the mesh's quaternion (rotation).
// This is paired with the initial orientation of the mesh/material.
function getTopFacingSideForQuaternion(
  quaternion: CANNON.Quaternion
): FacingSide | -1 {
  const orientationThreshold = 0.001;
  if (Math.abs(quaternion.w) < orientationThreshold) {
    return 'four';
  } else if (
    Math.abs(quaternion.x) < orientationThreshold && Math.abs(quaternion.z) < orientationThreshold
  ) {
    return 'six';
  } else if (
    Math.abs(Math.abs(quaternion.y) - Math.abs(quaternion.z)) < orientationThreshold
    && Math.abs(Math.abs(quaternion.x) - Math.abs(quaternion.w)) < orientationThreshold
  ) {
    if ((quaternion.x > 0 && quaternion.w < 0) || (quaternion.x < 0 && quaternion.w > 0)) {
      return 'one';
    } else {
      return 'two';
    }
  } else if (Math.abs(Math.abs(quaternion.x) - Math.abs(quaternion.y)) < orientationThreshold) {
    if ((quaternion.z > 0 && quaternion.w < 0) || (quaternion.z < 0 && quaternion.w > 0)) {
      return 'three';
    } else {
      return 'five';
    }
  }

  return -1;
}

function Scene(): JSX.Element {
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const threeScene = new THREE.Scene();

    // Helper for visually showing the origin/axes:
    // threeScene.add(new THREE.AxesHelper(5))

    // Setup our world.
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // m/s²

    // Create the physics ground plane.
    const planeShape = new CANNON.Plane();
    const planeBody = new CANNON.Body({ mass: 0 });
    planeBody.addShape(planeShape);
    planeBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    world.addBody(planeBody);

    // THREE.js plane that renders for debugging.
    // const geometry = new THREE.PlaneGeometry(10, 10);
    // const material = new THREE.MeshBasicMaterial({ color: 0xaaaa00, side: THREE.DoubleSide });
    // const plane = new THREE.Mesh(geometry, material);
    // plane.quaternion.setFromAxisAngle(
    //   new THREE.Vector3(1, 0, 0),
    //   -Math.PI / 2
    // );
    // threeScene.add(plane);

    // Create a backboard so the dice don't roll forever.
    // const planeBackboardBody = new CANNON.Body({ mass: 0 });
    // planeBackboardBody.addShape(planeShape);
    // planeBackboardBody.position.z -= 10;
    // world.addBody(planeBackboardBody);
    // And sideboards for the sides.
    // const planeSideboardBodyLeft = new CANNON.Body({ mass: 0 });
    // planeSideboardBodyLeft.addShape(planeShape);
    // planeSideboardBodyLeft.position.x -= 20;
    // planeSideboardBodyLeft.quaternion.setFromAxisAngle(
    //   new CANNON.Vec3(0, 1, 0),
    //   -Math.PI / 2
    // );
    // world.addBody(planeSideboardBodyLeft)
    // const planeSideboardBodyRight = new CANNON.Body({ mass: 0 });
    // planeSideboardBodyRight.addShape(planeShape);
    // planeSideboardBodyRight.position.x += 10;
    // planeSideboardBodyRight.quaternion.setFromAxisAngle(
    //   new CANNON.Vec3(0, 1, 0),
    //   -Math.PI / 2
    // );
    // world.addBody(planeSideboardBodyRight)

    const camera = createCamera();

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // On clear background (remove for real background).
    renderer.setClearColor(0xffffff, 0);

    sceneContainerRef.current.appendChild(renderer.domElement);

    // Enable stats on the view (fps etc.).
    const stats = Stats();
    sceneContainerRef.current.appendChild(stats.dom);
    document.body.appendChild(stats.dom)

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;

    const diceObjFile = (window as any).objAssetUrl || 'dice.obj';
    const diceMtlFile = (window as any).mtlAssetUrl || 'dice.mtl';

    const mtlLoader = new MTLLoader();

    const dice: Die[] = [];

    function createDice(diceModel: THREE.Mesh) {
      // Clear old dice.
      // while (dice.length) {
      //   dice.pop();
      // }
      const normalMaterial = new THREE.MeshNormalMaterial();

      const offsetFacingSide = Math.floor(Math.random() * 20);

      for (let i = 0; i < diceToMake; i++) {
        const dieShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        // Cube physics model for the dice (not rendered, used behind the scenes)
        const physicsModel = new CANNON.Body({ mass: 1 });
        physicsModel.addShape(dieShape);

        // Dice render model
        // (placed where the physics model is after collisions and gravity are applied).
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const physicsRenderMesh = new THREE.Mesh(cubeGeometry, normalMaterial);
        physicsRenderMesh.castShadow = true;

        const mesh = diceModel.clone();
        mesh.castShadow = true;

        physicsModel.position.x = mesh.position.x;
        physicsModel.position.y = mesh.position.y;
        physicsModel.position.z = mesh.position.z;

        const velocityTotalsForStabilizationCheck = [];
        for (let k = 0; k < stabilizeCheckArrayAmt; k++) {
          velocityTotalsForStabilizationCheck.push(100);;
        }

        
        const createSphereMesh = (sphereSide: FacingSide) => {
          const sphereGeometry = new THREE.SphereGeometry(0.05, 5, 5);
          const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x3030e6
          });
          const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
          sphereMesh.name = sphereSide;
          return sphereMesh;
        }

        // Create 6 points.
        // We use attach these points to the die and use them to determine
        // the orientation, which tells us the upwards facing value.
        const spheres: THREE.Mesh[] = [];
        for (let k = 0; k < 6; k++) {
          spheres.push(createSphereMesh(sides[k]));
        }
        // TODO: 0 based y?
        spheres[0].translateX(diceScale);
        spheres[1].translateX(-diceScale);
        spheres[2].translateZ(diceScale);
        spheres[3].translateZ(-diceScale);
        spheres[4].translateY(diceScale);
        spheres[5].translateY(-diceScale);

        const dieGroup = new THREE.Group();

        spheres.forEach(sphere => dieGroup.add(sphere));
        dieGroup.add(mesh);

        const die: Die = {
          dieGroup,
          mesh,
          physicsModel,
          physicsRenderMesh,
          // When the delta gets low then we know it's bout stable.
          velocityTotalsForStabilizationCheck,
          intendedFacingSide: ((i + offsetFacingSide) % 2 === 0) ? 'three' : 'four'
        };

        world.addBody(physicsModel);
        threeScene.add(dieGroup);
        dice.push(die);
      }

      console.log('Created', diceToMake, 'dice');
    }

    mtlLoader.load(diceMtlFile, (materials) => {
      materials.preload();

      console.log('loaded materials');

      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials).load(
        diceObjFile,
        (object: THREE.Group) => {
          object.traverse(function (child) {
            if ((child as THREE.Mesh).isMesh) {
              // This is coupled with the model from the .obj file.
              createDice(child as THREE.Mesh);

              console.log('loaded mesh', child);
            }
          });

          rollDice();
        },
        (xhr: ProgressEvent<EventTarget>) => {
          console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
        },
        (error: ErrorEvent) => {
          console.log(error);
        }
      );
    });

    const lights = createLights();
    lights.map((light) => threeScene.add(light));

    function render() {
      renderer.render(threeScene, camera);
    }

    function rollDice() {
      const newVelocity =
        diceThrowVelocity * Math.random() + diceThrowVelocity * 0.25;
      const newDiceRotationRandomness =
        diceRotationRandomness * Math.random() + diceRotationRandomness * 0.5;

      dice.forEach((die: Die, dieIndex: number) => {
        // Reset some of the helpers.
        die.didRotate = false;

        function getShootDirection() {
          const vector = new THREE.Vector3(0, 0, 1);
          vector.unproject(camera);
          const ray = new THREE.Ray(
            die.physicsModel.position as any,
            vector.sub(die.physicsModel.position as any).normalize()
          );
          return ray.direction;
        }

        const shootDirection = getShootDirection();

        // Move the die to the camera.
        die.physicsModel.position.x = camera.position.x;
        die.physicsModel.position.y = camera.position.y;
        die.physicsModel.position.z = camera.position.z;

        // Move the dice outside the player/camera sphere.
        const outRadius = 1;
        // Offset the 2nd die to make it rotate nice and not collide on initial.
        // const offset = (diceToMake > 2 && dieIndex === 1) ?  : 0;
        let offset = 0;
        if (dieIndex === 0) {
          offset = -1;
        } else if (dieIndex === 2) {
          offset = 1;
        }
        const x =
          die.physicsModel.position.x + offset +
          shootDirection.x * (outRadius * 1.02 + outRadius);
        const y =
          die.physicsModel.position.y +
          shootDirection.y * (outRadius * 1.02 + outRadius);
        const z =
          die.physicsModel.position.z +
          shootDirection.z * (outRadius * 1.02 + outRadius);

        // Offset the 2nd die to make it rotate nice and not collide on initial.
        // const offset = 2;
        // const x2 = die.physicsModel.position.x + Math.random() + shootDirection.x * offset * (outRadius * 1.02 + outRadius);
        // const y2 = die.physicsModel.position.y + Math.random() + shootDirection.y * offset * (outRadius * 1.02 + outRadius);
        // const z2 = die.physicsModel.position.z + Math.random() + shootDirection.z * offset * (outRadius * 1.02 + outRadius);

        die.physicsModel.position.x = x;
        die.physicsModel.position.y = y;
        die.physicsModel.position.z = z;

        // Cast the dice.
        die.physicsModel.velocity.set(
          shootDirection.x * newVelocity,
          shootDirection.y * newVelocity,
          shootDirection.z * newVelocity
        );
  
        // Rotate it randomly.
        die.physicsModel.quaternion.y =
          Math.random() *
          newDiceRotationRandomness *
          (Math.random() > 0.5 ? 1 : -1);
        die.physicsModel.quaternion.x =
          Math.random() *
          newDiceRotationRandomness *
          (Math.random() > 0.5 ? 1 : -1);
        die.physicsModel.quaternion.z =
          Math.random() *
          newDiceRotationRandomness *
          (Math.random() > 0.5 ? 1 : -1);
        die.physicsModel.quaternion.w =
          Math.random() *
          newDiceRotationRandomness *
          (Math.random() > 0.5 ? 1 : -1);

        die.dieGroup.rotation.x += 5;
        die.dieGroup.position.copy(die.physicsModel.position as any);

      });
    }

    window.addEventListener('click', () => {
      // if (!controls.enabled) {
      //   return;
      // }

      // Cast the dice on click.
      rollDice();
    });

    let animationLoop: number | null;

    // This function is the run loop that updates the dice and applies
    // gravity and collisions.
    // TODO: Detect dice position/rotation and flip after the velocity
    // and rotation are low to make the 4:3.
    function animate() {
      animationLoop = requestAnimationFrame(animate);

      // Run the simulation independently of framerate every 1 / 60 ms
      world.fixedStep();

      if (dice) {
        dice.forEach((die: Die) => {
          // die.physicsModel.rotation.x += 0.01;
          // die.physicsModel.rotation.y += 0.01;
          // die.physicsModel.rotation.z += 0.01;

          die.dieGroup.position.set(
            die.physicsModel.position.x,
            die.physicsModel.position.y,
            die.physicsModel.position.z
          );
          die.dieGroup.quaternion.set(
            die.physicsModel.quaternion.x,
            die.physicsModel.quaternion.y,
            die.physicsModel.quaternion.z,
            die.physicsModel.quaternion.w
          );

          die.physicsRenderMesh.position.x = die.physicsModel.position.x;
          die.physicsRenderMesh.position.y = die.physicsModel.position.y;
          die.physicsRenderMesh.position.z = die.physicsModel.position.z;

          // Not a true total it's just x and z.
          const velocityTotal = Math.abs(die.physicsModel.velocity.x) + Math.abs(die.physicsModel.velocity.z);
          die.velocityTotalsForStabilizationCheck.unshift(velocityTotal);
          die.velocityTotalsForStabilizationCheck.pop();

          const totalForLastVelocities = die.velocityTotalsForStabilizationCheck.reduce((
            previousVal, currentVal
          ) => previousVal + currentVal);
          if (totalForLastVelocities < 0.2) {
            // const facingSide = getTopFacingSideForQuaternion(die.physicsModel.quaternion);
            const facingSide = getTopFacingSideForDie(die);
            // console.log(facingSide);

            if (facingSide === -1) {
              // If the facing side is -1 it means we couldn't determine the
              // facing side so it is still stabilizing a bit.
              return;
            }

            // For only running it once:
            // if (die.didRotate) {
            //   return;
            // }

            if (facingSide === die.intendedFacingSide) {
              if (!die.didRotate) {
                console.log('Landed without needing adjustment on', facingSide);
                die.didRotate = true;
              }
              return;
            }

            die.didRotate = true;

            // debugQuaternion(die.physicsModel.quaternion);

            const loadedDieBump = getVelocityVectorToBumpDiceToLoadedFace(die);
            console.log('Applying loaded die bump', loadedDieBump);
            die.physicsModel.velocity.x = loadedDieBump.x;
            die.physicsModel.velocity.y = loadedDieBump.y;
            die.physicsModel.velocity.z = loadedDieBump.z;

            // const dir = new THREE.Vector3( 1, 2, 0 );

            // Debug render for the force we apply to the die to rotate.
            // Normalize the direction vector (convert to vector of length 1).
            loadedDieBump.normalize();
            // const origin = new THREE.Vector3(0, 0, 0);
            const origin = die.dieGroup.position;
            const length = 2;
            const hex = 0xbb00bb;
            const arrowHelper = new THREE.ArrowHelper(loadedDieBump, origin, length, hex);
            threeScene.add(arrowHelper);

            console.log('Loaded roll from', facingSide, 'to', die.intendedFacingSide);
          }
        });

      }

      controls.update();

      render();

      stats.update();
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

    // setInterval(function () {
    //   // TODO: Reset w move.
    //   // This resets the dice rolling every 2.5 seconds.
    //   rollDice();
    // }, 2500 /* 2500 milliseconds - 2.5 seconds. */);

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
