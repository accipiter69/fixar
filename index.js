// document.addEventListener("DOMContentLoaded", () => {
//   const container = document.getElementById("three-container");

//   const scene = new THREE.Scene();
//   let mixer;

//   const camera = new THREE.PerspectiveCamera(
//     75,
//     container.clientWidth / container.clientHeight,
//     0.1,
//     1000
//   );

//   const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//   renderer.setSize(container.clientWidth, container.clientHeight);
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.shadowMap.enabled = true;
//   renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//   renderer.setClearColor(0x000000, 0);
//   container.appendChild(renderer.domElement);

//   const controls = new THREE.OrbitControls(camera, renderer.domElement);
//   controls.enableDamping = true;
//   controls.dampingFactor = 0.05;
//   controls.enableZoom = false;
//   controls.enablePan = false;

//   const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
//   scene.add(ambientLight);

//   const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//   directionalLight.position.set(5, 5, 5);
//   directionalLight.castShadow = true;
//   directionalLight.shadow.mapSize.width = 2048;
//   directionalLight.shadow.mapSize.height = 2048;
//   scene.add(directionalLight);

//   const dracoLoader = new THREE.DRACOLoader();
//   dracoLoader.setDecoderPath(
//     "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
//   );

//   const loader = new THREE.GLTFLoader();
//   loader.setDRACOLoader(dracoLoader);

//   loader.load(
//     "https://fixar-dron.s3.us-east-2.amazonaws.com/models/025+anim.glb",
//     (gltf) => {
//       const model = gltf.scene;

//       const box = new THREE.Box3().setFromObject(model);
//       const size = box.getSize(new THREE.Vector3());

//       const maxDim = Math.max(size.x, size.y, size.z);
//       const scale = 60 / maxDim;
//       model.scale.setScalar(scale);

//       model.position.set(0, 0, 0);

//       const scaledBox = new THREE.Box3().setFromObject(model);
//       const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
//       model.position.sub(scaledCenter);

//       scene.add(model);

//       let bodyElement = null;
//       let originalColor = null;

//       model.traverse((child) => {
//         if (child.name === "Mesh491_1") {
//           bodyElement = child;
//           if (child.material && child.material.color) {
//             originalColor = child.material.color.clone();
//           }
//         }

//         if (child.isMesh && child.material) {
//           if (child.material.color) {
//             const color = child.material.color;
//             const r = Math.round(color.r * 255);
//             const g = Math.round(color.g * 255);
//             const b = Math.round(color.b * 255);

//             if (r > 200 && g < 50 && b < 50) {
//               console.log(`Red element found: ${child.name || "unnamed"}`, {
//                 r: r,
//                 g: g,
//                 b: b,
//                 hex: `#${r.toString(16).padStart(2, "0")}${g
//                   .toString(16)
//                   .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
//               });
//             }
//           }
//         }
//       });

//       console.log("bodyElement:", bodyElement);

//       // Перевіряємо наявність кнопок перед додаванням слухачів
//       const resetButton = document.getElementById("resetColor");
//       const greenButton = document.getElementById("greenColor");

//       if (resetButton) {
//         resetButton.addEventListener("click", () => {
//           if (bodyElement && bodyElement.material && originalColor) {
//             bodyElement.material.color.copy(originalColor);
//           }
//         });
//       }

//       if (greenButton) {
//         greenButton.addEventListener("click", () => {
//           if (bodyElement && bodyElement.material) {
//             bodyElement.material.color.setHex(0x00ff00);
//           }
//         });
//       }

//       if (gltf.animations && gltf.animations.length > 0) {
//         mixer = new THREE.AnimationMixer(model);
//         const action = mixer.clipAction(gltf.animations[0]);
//         action.play();
//       }

//       controls.target.set(0, 0, 0);
//       camera.position.set(0, 2, 8);
//       camera.lookAt(0, 0, 0);

//       animate();
//     },
//     undefined,
//     (error) => {
//       console.error("Error loading model:", error);
//     }
//   );

//   const clock = new THREE.Clock();

//   function animate() {
//     requestAnimationFrame(animate);

//     const delta = clock.getDelta();
//     if (mixer) mixer.update(delta);

//     controls.update();
//     camera.lookAt(0, 0, 0);

//     renderer.render(scene, camera);
//   }

//   window.addEventListener("resize", () => {
//     if (container) {
//       camera.aspect = container.clientWidth / container.clientHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(container.clientWidth, container.clientHeight);
//     }
//   });
// });
