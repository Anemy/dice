// Keeping these for copy pasta, not currently used in the dice simulation.

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
    color: 0xff00ff,
  });
  cubeSphereIntersectMesh.position.set(-2.5, 0, -3);

  return [cubeMesh, sphereMesh, cubeSphereIntersectMesh];
}
