let scene, camera, renderer, water, sun, sky, controls, pmremGenerator;

function init() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);

  sun = new THREE.Vector3();
  
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  water = new THREE.Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  
  sky = new THREE.Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  
  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;
  
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  
  // GUI
  const gui = new dat.GUI({ autoPlace: false, width: 300 });
  gui.domElement.style.position = 'absolute';
  gui.domElement.style.right = '10px';
  gui.domElement.style.bottom = '10px';
  document.body.appendChild(gui.domElement);

  const folderSky = gui.addFolder('Sky & Time');
  const folderSun = gui.addFolder('Sun');
  const folderWater = gui.addFolder('Water');
  const properties = {
    elevation: 2,
    azimuth: 180,
    exposure: 0.75,
    sunIntensity: 2.0,
    waterColor: '#70a070',
    distortionScale: 3.9
  };

  folderSky.add(properties, 'elevation', 0, 90, 0.1).name('Sun Elevation').onChange(updateSun);
  folderSky.add(properties, 'azimuth', -180, 180, 0.1).name('Sun Azimuth').onChange(updateSun);
  folderSky.add(properties, 'exposure', 0, 1, 0.0001).name('Scene Exposure').onChange(updateSun);
  folderSun.add(properties, 'sunIntensity', 0, 5, 0.01).name('Sun Intensity').onChange(updateSun);
  folderWater.addColor(properties, 'waterColor').name('Water Color').onChange(updateWater);
  folderWater.add(properties, 'distortionScale', 0, 8, 0.1).name('Wave Intensity').onChange(updateWater);

  // All folders are closed by default
  folderSky.close();
  folderSun.close();
  folderWater.close();

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - properties.elevation);
    const theta = THREE.MathUtils.degToRad(properties.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
    
    renderer.toneMappingExposure = properties.exposure;
    
    water.material.uniforms['sunColor'].value.setScalar(properties.sunIntensity);
  }

  function updateWater() {
    water.material.uniforms['waterColor'].value.setHex(parseInt(properties.waterColor.replace('#', '0x')));
    water.material.uniforms['distortionScale'].value = properties.distortionScale;
  }
  
  updateSun();
  updateWater();
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  water.material.uniforms['time'].value += 1.0 / 60.0;
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

init();
animate();