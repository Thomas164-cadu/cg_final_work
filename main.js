import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
document.body.appendChild(renderer.domElement);

let pokeball; 
let charmander; 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load("cartoon-forest-background.jpg");
scene.background = backgroundTexture;

const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0.3; 
plane.receiveShadow = true;
scene.add(plane);

const loader = new GLTFLoader();

function loadModel(path, position, callback) {
  loader.load(
    path,
    function (gltf) {
      const model = gltf.scene;
      model.position.set(position.x, position.y, position.z);
      model.castShadow = true; 
      model.receiveShadow = true; 
      scene.add(model);
      if (callback) callback(model);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% carregado");
    },
    function (error) {
      console.error("Erro ao carregar o modelo", error);
    }
  );
}

loadModel("Low_Poly_Charmander.glb", { x: 0, y: 0.5, z: -1 }, (model) => {
  charmander = model;
  charmander.rotation.set(0, Math.PI, 0); 
  charmander.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true; 
    }
  });
  console.log("Charmander carregado:", charmander);
});

loadModel("Low_Poly_Pokeball.glb", { x: 0, y: -0.5, z: 2 }, (model) => {
  pokeball = model;
  pokeball.rotation.set(0, 4, 0); 
  console.log("Pokebola carregada:", pokeball);
});

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(3, 10, 3);
directionalLight.castShadow = true;
scene.add(directionalLight);

directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

function createImpactEffect(position) {
  const particleCount = 20;
  const particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5; // X
    positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5; // Y
    positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5; // Z
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xff4500,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  
  setTimeout(() => {
    scene.remove(particles);
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  }, 500); 
}

function highlightCharmander() {
  if (!charmander) return;

  const originalMaterials = [];
  charmander.traverse((node) => {
    if (node.isMesh) {
      originalMaterials.push(node.material);
      node.material = new THREE.MeshStandardMaterial({
        color: 0xffd700, 
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
      });
    }
  });

  setTimeout(() => {
    let i = 0;
    charmander.traverse((node) => {
      if (node.isMesh) {
        node.material = originalMaterials[i++];
      }
    });
  }, 500);
}

function captureCharmander() {
  if (!charmander || !pokeball) return;

  const duration = 1000; 
  const startPosition = charmander.position.clone();
  const targetPosition = pokeball.position.clone();

  const startTime = performance.now();

  function animateCapture() {
    const elapsedTime = performance.now() - startTime;
    const t = Math.min(elapsedTime / duration, 1); 

    charmander.position.lerpVectors(startPosition, targetPosition, t);

    if (t < 1) {
      requestAnimationFrame(animateCapture);
    } else {
      scene.remove(charmander);
      console.log("Charmander capturado!");

      startPokeballBlinking();
    }
  }

  animateCapture();
}

function startPokeballBlinking() {
  if (!pokeball) return;

  let isBlinking = true; // Estado de piscar
  const originalMaterial = pokeball.traverse((node) => {
    if (node.isMesh) return node.material;
  });

  const interval = setInterval(() => {
    pokeball.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive = isBlinking
          ? new THREE.Color(0xff0000) 
          : new THREE.Color(0x000000); 
      }
    });
    isBlinking = !isBlinking;
  }, 200); 

  setTimeout(() => {
    clearInterval(interval);

    pokeball.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive = new THREE.Color(0x000000);
      }
    });

    console.log("Pokébola parou de piscar.");
  }, 2000);
}

function resetScene() {
  if (pokeball) {
    scene.remove(pokeball);
    pokeball = null;
  }
  if (charmander) {
    scene.remove(charmander);
    charmander = null;
  }

  loadModel("Low_Poly_Charmander.glb", { x: 0, y: 0.5, z: -1 }, (model) => {
    charmander = model;
    charmander.rotation.set(0, Math.PI, 0);
    charmander.traverse((node) => {
      if (node.isMesh) node.castShadow = true;
    });
  });

  loadModel("Low_Poly_Pokeball.glb", { x: 0, y: -0.5, z: 2 }, (model) => {
    pokeball = model;
    pokeball.rotation.set(0, 4, 0);
  });

  console.log("Cena resetada!");
}

document.getElementById("resetButton").addEventListener("click", resetScene);

let isMousePressed = false;
let initialMousePosition = new THREE.Vector2(); 
let finalMousePosition = new THREE.Vector2(); 
let isMouseMoving = false; 

window.addEventListener("mousemove", (event) => {
  if (isMousePressed && pokeball) {
    const currentMousePosition = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    if (!currentMousePosition.equals(initialMousePosition)) {
      isMouseMoving = true; 

      pokeball.rotation.x += 0.1; 
      pokeball.rotation.y += 0.1; 
    }

    finalMousePosition.copy(currentMousePosition);
  }
});

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    isMousePressed = true;
    isMouseMoving = true;

    initialMousePosition.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    finalMousePosition.copy(initialMousePosition);
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    isMousePressed = false;

    if (isMouseMoving && pokeball) {
      
      const targetPosition = new THREE.Vector3(pokeball.position.x, pokeball.position.y, pokeball.position.z);
      const throwDirection = new THREE.Vector3(
        targetPosition.x - camera.position.x, 
        targetPosition.y - camera.position.y, 
        targetPosition.z - camera.position.z  
      ).normalize();

      const throwForce = initialMousePosition.distanceTo(finalMousePosition) * 5; 

      const adjustedTargetPosition = new THREE.Vector3(
        targetPosition.x + throwDirection.x * throwForce,
        targetPosition.y + throwDirection.y * throwForce,
        targetPosition.z + throwDirection.z * throwForce
      );

      throwPokeballWithParabolicMotion(adjustedTargetPosition, throwDirection, throwForce);
    } else {
      console.log("Pokébola clicada sem movimento.");
    }

    isMouseMoving = false; 
  }
});

function throwPokeballWithParabolicMotion(targetPosition, direction, throwForce) {
  if (!pokeball) return;

  const startPosition = pokeball.position.clone(); 

  const horizontalVelocity = direction.clone().multiplyScalar(throwForce);
  const verticalVelocity = new THREE.Vector3(0, 10, 0); 
  
  const gravity = -9.8;

  const duration = 1000; 
  const startTime = performance.now();

  function animateThrow() {
    const elapsedTime = performance.now() - startTime;
    const t = Math.min(elapsedTime / duration, 1);

    const horizontalMovement = horizontalVelocity.clone().multiplyScalar(t); 
    const verticalMovement = verticalVelocity.clone().multiplyScalar(t); 

    const gravityEffect = gravity * t * t;
    const verticalPosition = verticalMovement.y + gravityEffect;

    pokeball.position.set(
      startPosition.x + horizontalMovement.x,
      startPosition.y + verticalPosition,
      startPosition.z + horizontalMovement.z
    );

    pokeball.rotation.x += 0.1;
    pokeball.rotation.y += 0.1;

    const distanceToTarget = pokeball.position.distanceTo(charmander.position);
    if (t >= 1 || distanceToTarget < 0.5) {
      if (distanceToTarget < 0.5) {
        console.log("Pokébola acertou o Pokémon!");
        createImpactEffect(charmander.position);

        highlightCharmander();

        captureCharmander();
      } else {
        console.log("Pokébola chegou ao seu destino sem acertar o Pokémon.");
      }
    } else {
      requestAnimationFrame(animateThrow);
    }
  }

  animateThrow();
}

camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
