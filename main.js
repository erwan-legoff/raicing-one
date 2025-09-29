import * as THREE from 'three'

function animate() {
    renderer.render(scene, camera);
}

const scene = new THREE.Scene();
const camParam = {
    fiedOfView: 75,
    aspectRatio: window.innerWidth / window.innerHeight,
    nearClip: 0.1,
    farClip: 1000
}

const CONTROLS = {
    FORWARD: "ArrowUp",
    BACKWARD: "ArrowDown",
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
}
window.addEventListener("keydown", function (e) {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

window.addEventListener("keydown", (event) => {
    console.log(event.key)
    const STEP = 0.1
    switch (event.key) {
        case CONTROLS.FORWARD:
            carMesh.position.z -= STEP
            break;
        case CONTROLS.BACKWARD:
            carMesh.position.z += STEP
            break;
        case CONTROLS.LEFT:
            carMesh.position.x -= STEP
            break;
        case CONTROLS.RIGHT:
            carMesh.position.x += STEP
            break;
        default:
            break;
    }

});
const camera = new THREE.PerspectiveCamera(camParam.fiedOfView, camParam.aspectRatio, camParam.nearClip, camParam.farClip)
camera.position.z = 5
camera.position.y = 2
camera.rotateX(0)

const renderer = new THREE.WebGLRenderer()
// setting the resolution
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = createLight();
scene.add(light)


const carMesh = createCarMesh();
const ROAD_HEIGHT = 0.1
const roadMesh = createRoadMesh();
scene.add(roadMesh)
scene.add(carMesh);
renderer.setAnimationLoop(animate);



function createRoadMesh() {
    const roadGeometry = new THREE.BoxGeometry(2, ROAD_HEIGHT, 200);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: "#424242ff" });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    roadMesh.position.setY(-ROAD_HEIGHT);
    return roadMesh;
}

function createLight() {
    const lightColor = 0xFFFFFF;
    const lightIntensity = 3;
    const light = new THREE.DirectionalLight(lightColor, lightIntensity);
    light.position.set(-1, 2, 4);
    return light;
}

function createCarMesh() {
    const carHeight = 1
    const carGeometry = new THREE.BoxGeometry(carHeight, carHeight, carHeight);
    const carMaterial = new THREE.MeshPhongMaterial({ color: "#327fa8" });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);
    carMesh.position.y = carHeight
    return carMesh;
}
