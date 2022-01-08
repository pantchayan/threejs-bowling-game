import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/loaders/GLTFLoader.js";
console.log(CANNON);

/**
 * Debug
 */
const gui = new dat.GUI();
const debugObject = {};

debugObject.createSphere = () => {
  createSphere(Math.random() * 0.5, {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};

gui.add(debugObject, "createSphere");

debugObject.createBox = () => {
  createBox(Math.random(), Math.random(), Math.random(), {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};
gui.add(debugObject, "createBox");

debugObject.createModel = () => {
  createModel(Math.random(), Math.random(), Math.random(), {
    x: (Math.random() - 0.5) * 3,
    y: 3,
    z: (Math.random() - 0.5) * 3,
  });
};
gui.add(debugObject, "createModel");

// Reset
debugObject.reset = () => {
  for (const object of objectsToUpdate) {
    // Remove body
    object.body.removeEventListener("collide", playHitSound);
    world.removeBody(object.body);

    // Remove mesh
    scene.remove(object.mesh);
  }
};
gui.add(debugObject, "reset");

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Sounds
 */
const hitSound = new Audio("./assets/sounds/hit.mp3");

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal();

  if (impactStrength > 1.5) {
    hitSound.volume = Math.random();
    hitSound.currentTime = 0;
    hitSound.play();
  }
};

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

const environmentMapTexture = cubeTextureLoader.load([
  // "/textures/environmentMaps/0/px.png",
  // "/textures/environmentMaps/0/nx.png",
  // "/textures/environmentMaps/0/py.png",
  // "/textures/environmentMaps/0/ny.png",
  // "/textures/environmentMaps/0/pz.png",
  // "/textures/environmentMaps/0/nz.png",
]);

/**
 * Physics
 */
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.gravity.set(0, -9.82, 0);

// Default material
const defaultMaterial = new CANNON.Material("default");
const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7,
  }
);
world.defaultContactMaterial = defaultContactMaterial;

// Floor
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body();
floorBody.mass = 0;
floorBody.addShape(floorShape);
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
world.addBody(floorBody);

/**
 * Utils
 */
const objectsToUpdate = [];

// Create sphere
const sphereGeometry = new THREE.SphereBufferGeometry(1, 20, 20);
const sphereMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});

const createSphere = (radius, position) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  mesh.castShadow = true;
  mesh.scale.set(radius, radius, radius);
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const shape = new CANNON.Sphere(radius);

  const body = new CANNON.Body({
    mass: 7,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  // body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // Save in objects
  objectsToUpdate.push({ mesh, body });
};

// Create box
const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshStandardMaterial({
  metalness: 0.3,
  roughness: 0.4,
  envMap: environmentMapTexture,
});
const createBox = (width, height, depth, position) => {
  // Three.js mesh
  const mesh = new THREE.Mesh(boxGeometry, boxMaterial);
  mesh.scale.set(width, height, depth);
  mesh.castShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  // Cannon.js body
  const shape = new CANNON.Box(
    new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
  );

  const body = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // console.log(mesh)
  // Save in objects
  objectsToUpdate.push({ mesh, body });
  setInterval(() => {

    console.log(mesh.position, body.position);
  }, 1000)
};

createBox(0.14, 0.5, 0.14, { x: 0, y: 3, z: 0 });


// setInterval(() => {

//   createSphere(Math.random(), { x: Math.random() * 5, y: 3, z: Math.random() * 5});
// }, 100)

const createModel = async (width, height, depth, position) => {
  // Cannon.js body
  //0.07
  // 0.25
  // 0.07
  const shape = new CANNON.Box(
    new CANNON.Vec3(0.14 * 0.5, 0.5 * 0.5, 0.14 * 0.5)
  );

  const body = new CANNON.Body({
    mass: 1.5,
    position: new CANNON.Vec3(0, -0.5, 0),
    shape: shape,
    material: defaultMaterial,
  });
  body.position.copy(position);
  body.addEventListener("collide", playHitSound);
  world.addBody(body);

  // Three.js mesh

  let modelLoaded = false;
  let modelGroup;
  const loader = new GLTFLoader();
  await loader.load("./assets/models/bowling-pin/scene.gltf", (gltf) => {
    console.log(gltf.scene);
    gltf.scene.scale.set(1.5, 1.5, 1.5);
    gltf.scene.position.copy(position);
    modelGroup = gltf.scene;
    scene.add(gltf.scene);
    objectsToUpdate.push({ mesh: modelGroup, body });
  });

  // Save in objects
};

/**
 * Pins
 */

const makePins = async () => {
  const pinPositions = [
    {
      x: 0,
      z: 0,
    },
    {
      x: -0.14,
      z: -0.28,
    },
    {
      x: +0.14,
      z: -0.28,
    },
    {
      x: -0.28,
      z: -0.56,
    },
    {
      x: 0,
      z: -0.56,
    },
    {
      x: +0.28,
      z: -0.56,
    },
    {
      x: -0.42,
      z: -0.84,
    },
    {
      x: -0.14,
      z: -0.84,
    },
    {
      x: 0.14,
      z: -0.84,
    },
    {
      x: 0.42,
      z: -0.84,
    },
  ];

  for (let i = 0; i < 10; i++) {
    let position = { x: pinPositions[i].x, y: 0.25, z: -1 + pinPositions[i].z };
    const shape = new CANNON.Box(
      new CANNON.Vec3(0.14 * 0.5, 0.5 * 0.5, 0.14 * 0.5)
    );

    const body = new CANNON.Body({
      mass: 1.5,
      position: new CANNON.Vec3(0, 3, 0),
      shape: shape,
      material: defaultMaterial,
    });
    body.position.copy(position);
    body.addEventListener("collide", playHitSound);
    world.addBody(body);

    // Three.js mesh

    let modelLoaded = false;
    let modelGroup;
    const loader = new GLTFLoader();
    await loader.load("./assets/models/bowling-pin/scene.gltf", (gltf) => {
      gltf.scene.scale.set(1.5, 1.5, 1.5);
      gltf.scene.position.copy(position);
      modelGroup = gltf.scene;
      scene.add(gltf.scene);
      objectsToUpdate.push({ mesh: modelGroup, body });
      console.log(modelGroup.position, body.position);
    });
  }
};

makePins();

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(10, 100),
  new THREE.MeshStandardMaterial({
    color: "#777777",
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0.5, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

///////////////////////////////////////////////////////////////Debugger//////////////////////////////////////////////////////////////////////////////

let CannonDebugRenderer = function (scene, world, options) {
  options = options || {};

  this.scene = scene;
  this.world = world;

  this._meshes = [];

  this._material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });
  this._sphereGeometry = new THREE.SphereGeometry(1);
  this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  this._planeGeometry = new THREE.PlaneGeometry(10, 10, 20, 20);
  this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10);
};

CannonDebugRenderer.prototype = {
  tmpVec0: new CANNON.Vec3(),
  tmpVec1: new CANNON.Vec3(),
  tmpVec2: new CANNON.Vec3(),
  tmpQuat0: new CANNON.Vec3(),

  update: function () {
    var bodies = this.world.bodies;
    var meshes = this._meshes;
    var shapeWorldPosition = this.tmpVec0;
    var shapeWorldQuaternion = this.tmpQuat0;

    var meshIndex = 0;

    for (var i = 0; i !== bodies.length; i++) {
      var body = bodies[i];

      for (var j = 0; j !== body.shapes.length; j++) {
        var shape = body.shapes[j];

        this._updateMesh(meshIndex, body, shape);

        var mesh = meshes[meshIndex];

        if (mesh) {
          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

          // Copy to meshes
          mesh.position.copy(shapeWorldPosition);
          mesh.quaternion.copy(shapeWorldQuaternion);
        }

        meshIndex++;
      }
    }

    for (var i = meshIndex; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh) {
        this.scene.remove(mesh);
      }
    }

    meshes.length = meshIndex;
  },

  _updateMesh: function (index, body, shape) {
    var mesh = this._meshes[index];
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh);
      }
      mesh = this._meshes[index] = this._createMesh(shape);
    }
    this._scaleMesh(mesh, shape);
  },

  _typeMatch: function (mesh, shape) {
    if (!mesh) {
      return false;
    }
    var geo = mesh.geometry;
    return (
      (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
      (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
      (geo.id === shape.geometryId &&
        shape instanceof CANNON.ConvexPolyhedron) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Trimesh) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
    );
  },

  _createMesh: function (shape) {
    var mesh;
    var material = this._material;

    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        mesh = new THREE.Mesh(this._sphereGeometry, material);
        break;

      case CANNON.Shape.types.BOX:
        mesh = new THREE.Mesh(this._boxGeometry, material);
        break;

      case CANNON.Shape.types.PLANE:
        mesh = new THREE.Mesh(this._planeGeometry, material);
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        // Create mesh
        var geo = new THREE.Geometry();

        // Add vertices
        for (var i = 0; i < shape.vertices.length; i++) {
          var v = shape.vertices[i];
          geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        for (var i = 0; i < shape.faces.length; i++) {
          var face = shape.faces[i];

          // add triangles
          var a = face[0];
          for (var j = 1; j < face.length - 1; j++) {
            var b = face[j];
            var c = face[j + 1];
            geo.faces.push(new THREE.Face3(a, b, c));
          }
        }
        geo.computeBoundingSphere();
        geo.computeFaceNormals();

        mesh = new THREE.Mesh(geo, material);
        shape.geometryId = geo.id;
        break;

      case CANNON.Shape.types.TRIMESH:
        var geometry = new THREE.Geometry();
        var v0 = this.tmpVec0;
        var v1 = this.tmpVec1;
        var v2 = this.tmpVec2;
        for (var i = 0; i < shape.indices.length / 3; i++) {
          shape.getTriangleVertices(i, v0, v1, v2);
          geometry.vertices.push(
            new THREE.Vector3(v0.x, v0.y, v0.z),
            new THREE.Vector3(v1.x, v1.y, v1.z),
            new THREE.Vector3(v2.x, v2.y, v2.z)
          );
          var j = geometry.vertices.length - 3;
          geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        shape.geometryId = geometry.id;
        break;

      case CANNON.Shape.types.HEIGHTFIELD:
        var geometry = new THREE.Geometry();
        var v0 = this.tmpVec0;
        var v1 = this.tmpVec1;
        var v2 = this.tmpVec2;
        for (var xi = 0; xi < shape.data.length - 1; xi++) {
          for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
            for (var k = 0; k < 2; k++) {
              shape.getConvexTrianglePillar(xi, yi, k === 0);
              v0.copy(shape.pillarConvex.vertices[0]);
              v1.copy(shape.pillarConvex.vertices[1]);
              v2.copy(shape.pillarConvex.vertices[2]);
              v0.vadd(shape.pillarOffset, v0);
              v1.vadd(shape.pillarOffset, v1);
              v2.vadd(shape.pillarOffset, v2);
              geometry.vertices.push(
                new THREE.Vector3(v0.x, v0.y, v0.z),
                new THREE.Vector3(v1.x, v1.y, v1.z),
                new THREE.Vector3(v2.x, v2.y, v2.z)
              );
              var i = geometry.vertices.length - 3;
              geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
            }
          }
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        shape.geometryId = geometry.id;
        break;
    }

    if (mesh) {
      this.scene.add(mesh);
    }

    return mesh;
  },

  _scaleMesh: function (mesh, shape) {
    switch (shape.type) {
      case CANNON.Shape.types.SPHERE:
        var radius = shape.radius;
        mesh.scale.set(radius, radius, radius);
        break;

      case CANNON.Shape.types.BOX:
        mesh.scale.copy(shape.halfExtents);
        mesh.scale.multiplyScalar(2);
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        mesh.scale.set(1, 1, 1);
        break;

      case CANNON.Shape.types.TRIMESH:
        mesh.scale.copy(shape.scale);
        break;

      case CANNON.Shape.types.HEIGHTFIELD:
        mesh.scale.set(1, 1, 1);
        break;
    }
  },
};

var cannonDebugRenderer = new CannonDebugRenderer(scene, world);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // Update physics
  world.step(1 / 60, deltaTime, 3);

  for (const object of objectsToUpdate) {
    // object.mesh.position.copy(object.body.position);
    // object.mesh.quaternion.copy(object.body.quaternion);
    // object.mesh.position.y = 0;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);
  cannonDebugRenderer.update();
  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
