
const canvas = document.querySelector("canvas");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

camera.position.z = 5;

// Add a test cube first
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Load GLTFLoader script dynamically
const gltfScript = document.createElement('script');
gltfScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
gltfScript.onload = function() {
  console.log('GLTFLoader loaded successfully');
  
  const loader = new THREE.GLTFLoader();
  
  loader.load(
    "https://raw.githubusercontent.com/accipiter69/fixar/main/models/anim.glb",
    (gltf) => {
      console.log("Model loaded successfully:", gltf);
      scene.remove(cube);
      scene.add(gltf.scene);
      
      // Position and scale the model
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.scale.set(1, 1, 1);
      
      // Play animations if available
      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        
        // Update animation in render loop
        const clock = new THREE.Clock();
        const originalAnimate = window.animate;
        window.animate = function() {
          requestAnimationFrame(window.animate);
          mixer.update(clock.getDelta());
          renderer.render(scene, camera);
        };
      }
    },
    (progress) => {
      console.log("Loading progress:", progress);
    },
    (error) => {
      console.error("Error loading model:", error);
    }
  );
};
gltfScript.onerror = function() {
  console.error('Failed to load GLTFLoader script');
};
document.head.appendChild(gltfScript);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();

console.log("3D scene with model loading initialized");
