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
renderer.shadowMap.enabled = true; // Ativar sombras no renderizador
document.body.appendChild(renderer.domElement);

let pokeball; // Variável para armazenar a Pokébola
let charmander; // Variável para armazenar o Charmander
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Adicionar imagem de fundo
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load("cartoon-forest-background.jpg");
scene.background = backgroundTexture;

const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Plano horizontal
plane.position.y = 0.3; // Chão
plane.receiveShadow = true;
scene.add(plane);

// Loader para carregar os modelos
const loader = new GLTFLoader();

// Função para carregar um modelo
function loadModel(path, position, callback) {
  loader.load(
    path,
    function (gltf) {
      const model = gltf.scene;
      model.position.set(position.x, position.y, position.z);
      model.castShadow = true; // Ativar sombra para o modelo
      model.receiveShadow = true; // Habilitar o recebimento de sombra
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

// Carregar o Charmander
loadModel("Low_Poly_Charmander.glb", { x: 0, y: 0.5, z: -1 }, (model) => {
  charmander = model;
  charmander.rotation.set(0, Math.PI, 0); // Virar para frente
  charmander.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true; // O Charmander projeta sombra
    }
  });
  console.log("Charmander carregado:", charmander);
});

// Carregar a Pokébola
loadModel("Low_Poly_Pokeball.glb", { x: 0, y: -0.5, z: 2 }, (model) => {
  pokeball = model;
  pokeball.rotation.set(0, 4, 0); // Virar para frente
  console.log("Pokebola carregada:", pokeball);
});

// Luz direcional (projetando sombra)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(3, 10, 3);
directionalLight.castShadow = true; // Habilitar a projeção de sombra na luz
scene.add(directionalLight);

// Ajustar configurações da luz direcional
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;

// Luz ambiente
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

  // Remover partículas após um curto período
  setTimeout(() => {
    scene.remove(particles);
    particlesGeometry.dispose();
    particlesMaterial.dispose();
  }, 500); // Duração do efeito em milissegundos
}

function highlightCharmander() {
  if (!charmander) return;

  // Salvar materiais originais
  const originalMaterials = [];
  charmander.traverse((node) => {
    if (node.isMesh) {
      originalMaterials.push(node.material);
      node.material = new THREE.MeshStandardMaterial({
        color: 0xffd700, // Cor brilhante (dourado)
        emissive: 0xffd700,
        emissiveIntensity: 0.8,
      });
    }
  });

  // Reverter o material após 500ms
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

  // Animação do Charmander se movendo para a Pokébola
  const duration = 1000; // Duração da captura em milissegundos
  const startPosition = charmander.position.clone();
  const targetPosition = pokeball.position.clone();

  const startTime = performance.now();

  function animateCapture() {
    const elapsedTime = performance.now() - startTime;
    const t = Math.min(elapsedTime / duration, 1); // Progresso da animação (0 a 1)

    // Interpolação linear entre startPosition e targetPosition
    charmander.position.lerpVectors(startPosition, targetPosition, t);

    if (t < 1) {
      requestAnimationFrame(animateCapture);
    } else {
      // Remover o Charmander da cena
      scene.remove(charmander);
      console.log("Charmander capturado!");

      // Iniciar efeito de piscar da Pokébola
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

  // Alterar o material da Pokébola para simular o piscar
  const interval = setInterval(() => {
    pokeball.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive = isBlinking
          ? new THREE.Color(0xff0000) // Cor de piscar
          : new THREE.Color(0x000000); // Normal
      }
    });
    isBlinking = !isBlinking;
  }, 200); // Intervalo de piscar (200ms)

  // Parar o piscar após 2 segundos
  setTimeout(() => {
    clearInterval(interval);

    // Restaurar o material original
    pokeball.traverse((node) => {
      if (node.isMesh) {
        node.material.emissive = new THREE.Color(0x000000);
      }
    });

    console.log("Pokébola parou de piscar.");
  }, 2000);
}

function resetScene() {
  // Remover Pokébola e Charmander (se existentes)
  if (pokeball) {
    scene.remove(pokeball);
    pokeball = null;
  }
  if (charmander) {
    scene.remove(charmander);
    charmander = null;
  }

  // Recarregar os modelos
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

let isMousePressed = false; // Indica se o botão do mouse está pressionado
let initialMousePosition = new THREE.Vector2(); // Posição inicial do mouse
let finalMousePosition = new THREE.Vector2(); // Posição final do mouse
let isMouseMoving = false; // Indica se o mouse está em movimento

// Evento de movimento do mouse
window.addEventListener("mousemove", (event) => {
  if (isMousePressed && pokeball) {
    // Normalizar as coordenadas do mouse
    const currentMousePosition = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Detectar se o mouse se moveu
    if (!currentMousePosition.equals(initialMousePosition)) {
      isMouseMoving = true; // O mouse está em movimento

      // Atualizar a rotação da Pokébola (efeito visual)
      pokeball.rotation.x += 0.1; // Rotação no eixo X
      pokeball.rotation.y += 0.1; // Rotação no eixo Y
    }

    // Atualizar a posição final do mouse
    finalMousePosition.copy(currentMousePosition);
  }
});

// Evento de clique do mouse
window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    // Botão esquerdo do mouse
    isMousePressed = true; // Ativar o estado de movimento
    isMouseMoving = true; // Resetar o estado de movimento

    // Armazenar a posição inicial do mouse
    initialMousePosition.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    // Resetar a posição final do mouse
    finalMousePosition.copy(initialMousePosition);
  }
});

// Evento de soltura do mouse
window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    isMousePressed = false;

    if (isMouseMoving && pokeball) {
      // Calcular a direção do arremesso com base na posição do Pokémon
      const targetPosition = new THREE.Vector3(pokeball.position.x, pokeball.position.y, pokeball.position.z);
      const throwDirection = new THREE.Vector3(
        targetPosition.x - camera.position.x, // Direção em relação à câmera
        targetPosition.y - camera.position.y, // Direção em relação à câmera
        targetPosition.z - camera.position.z  // Direção em relação à câmera
      ).normalize();

      // Calcular a força do arremesso com base na distância do mouse
      const throwForce = initialMousePosition.distanceTo(finalMousePosition) * 5; // Ajuste a força conforme necessário

      // Ajustar a posição de lançamento para melhorar o efeito de colisão
      const adjustedTargetPosition = new THREE.Vector3(
        targetPosition.x + throwDirection.x * throwForce,
        targetPosition.y + throwDirection.y * throwForce,
        targetPosition.z + throwDirection.z * throwForce
      );

      // Aplicar o arremesso à Pokébola
      throwPokeballWithParabolicMotion(adjustedTargetPosition, throwDirection, throwForce);
    } else {
      console.log("Pokébola clicada sem movimento.");
    }

    isMouseMoving = false; // Resetar o estado de movimento
  }
});

// Função para arremessar a Pokébola com movimento parabólico
function throwPokeballWithParabolicMotion(targetPosition, direction, throwForce) {
  if (!pokeball) return;

  const startPosition = pokeball.position.clone(); // Posição inicial da Pokébola

  // Componentes horizontais e verticais do movimento
  const horizontalVelocity = direction.clone().multiplyScalar(throwForce); // Velocidade horizontal
  const verticalVelocity = new THREE.Vector3(0, 10, 0); // Velocidade inicial vertical (ajustável)
  
  const gravity = -9.8; // Aceleração gravitacional (ajustável)

  const duration = 1000; // Duração da animação em milissegundos
  const startTime = performance.now();

  function animateThrow() {
    const elapsedTime = performance.now() - startTime;
    const t = Math.min(elapsedTime / duration, 1); // Progresso da animação (0 a 1)

    // Cálculo da posição com base na física de movimento projetado
    const horizontalMovement = horizontalVelocity.clone().multiplyScalar(t); // Movimento horizontal
    const verticalMovement = verticalVelocity.clone().multiplyScalar(t); // Movimento vertical

    // Aplicar o efeito da gravidade no movimento vertical
    const gravityEffect = gravity * t * t;
    const verticalPosition = verticalMovement.y + gravityEffect;

    // Atualizar posição da Pokébola
    pokeball.position.set(
      startPosition.x + horizontalMovement.x,
      startPosition.y + verticalPosition,
      startPosition.z + horizontalMovement.z
    );

    // Rotação da Pokébola (efeito visual)
    pokeball.rotation.x += 0.1;
    pokeball.rotation.y += 0.1;

    // Verificação de colisão com o Pokémon
    const distanceToTarget = pokeball.position.distanceTo(charmander.position);
    if (t >= 1 || distanceToTarget < 0.5) { // Colisão ou chegou ao final
      if (distanceToTarget < 0.5) {
        console.log("Pokébola acertou o Pokémon!");
        createImpactEffect(charmander.position); // Efeito de impacto

        highlightCharmander(); // Destacar o Charmander

        captureCharmander(); // Chama a função de captura
      } else {
        console.log("Pokébola chegou ao seu destino sem acertar o Pokémon.");
      }
    } else {
      requestAnimationFrame(animateThrow);
    }
  }

  animateThrow();
}

// Configurar câmera
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);

// Animação
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
