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

// Load the three-gltf-loader
const script = document.createElement("script");
script.src =
  "https://cdn.jsdelivr.net/npm/three-gltf-loader@1.111.0/index.min.js";

script.onload = function () {
  console.log("Three GLTF Loader loaded successfully");

  setTimeout(() => {
    let loader = null;

    // Check what's actually available
    console.log("Checking THREE object keys:", Object.keys(THREE));
    console.log(
      "Window keys with GLTF:",
      Object.keys(window).filter((k) => k.toLowerCase().includes("gltf"))
    );

    if (typeof THREE.GLTFLoader !== "undefined") {
      console.log("GLTFLoader found in THREE.GLTFLoader");
      loader = new THREE.GLTFLoader();
    } else if (typeof GLTFLoader !== "undefined") {
      console.log("GLTFLoader found as global GLTFLoader");
      loader = new GLTFLoader();
    } else if (window.THREE && window.THREE.GLTFLoader) {
      console.log("GLTFLoader found in window.THREE.GLTFLoader");
      loader = new window.THREE.GLTFLoader();
    } else {
      // Try to create it manually - some loaders work this way
      try {
        console.log("Trying to create loader directly...");
        loader = new THREE.GLTFLoader();
        console.log("Direct creation worked!");
      } catch (e) {
        console.log("Direct creation failed:", e.message);
        console.log("Using simple fetch approach instead");

        // Fallback: use fetch to load the GLB directly
        fetch(
          "https://raw.githubusercontent.com/accipiter69/fixar/main/models/anim.glb"
        )
          .then((response) => response.arrayBuffer())
          .then((data) => {
            console.log("GLB file downloaded:", data.byteLength, "bytes");
            console.log("Cannot parse without GLTFLoader - keeping cube");
          })
          .catch((error) => {
            console.error("Failed to download GLB:", error);
          });
        return;
      }
    }

    if (loader) {
      console.log("Starting to load model...");
      loader.load(
        "https://raw.githubusercontent.com/accipiter69/fixar/main/models/anim.glb",
        (gltf) => {
          console.log("Model loaded successfully:", gltf);
          scene.remove(cube);
          scene.add(gltf.scene);
        },
        (progress) => {
          console.log("Loading progress:", progress);
        },
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    }
  }, 200);
};

script.onerror = function () {
  console.error("Failed to load three-gltf-loader");
};

document.head.appendChild(script);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

animate();

console.log("3D scene with model loading initialized");
