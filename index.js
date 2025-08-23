const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

const container = document.querySelector(".cool-div");
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000, 0);
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

let model;
let mixer;

const loader = new THREE.GLTFLoader();
loader.load(
  "https://raw.githubusercontent.com/accipiter69/fixar/main/models/anim.glb",
  (gltf) => {
    model = gltf.scene;
    scene.add(model);

    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }
  },
  undefined,
  (error) => {
    console.error("Error loading model:", error);
  }
);

camera.position.z = 5;

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (mixer) {
    mixer.update(clock.getDelta());
  }

  if (model) {
    model.rotation.y += 0.005;
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  const container = document.querySelector(".cool-div");
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

animate();
