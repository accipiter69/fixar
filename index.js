const loader = new THREE.GLTFLoader();
loader.load(
  "https://raw.githubusercontent.com/accipiter69/fixar/main/models/anim.glb",
  (gltf) => {
    console.log("Model loaded successfully:", gltf);
  },
  undefined,
  (error) => {
    console.error("Error loading model:", error);
  }
);
