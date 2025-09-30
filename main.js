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

const floorLamp = createFloorLamp()
scene.add(floorLamp)



function createRoadMesh() {
    const roadGeometry = new THREE.BoxGeometry(4, ROAD_HEIGHT, 200);
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

function createFloorLamp(){
    const lightColor = "#fffbc3ff"
    const lightIntensity = 1
    const light = new THREE.DirectionalLight(lightColor,lightIntensity)
    const lampWidth = 1
    const lampHeight = 0.3
    const lampDepth = 1
    const floorLampMaterial = new THREE.MeshPhongMaterial({reflectivity:1, shininess:75,specular:"#818181ff"})
    const floorLampGroup = new THREE.Group()
    const lampGeometry = new THREE.BoxGeometry(lampWidth,lampHeight,lampDepth)
    const lampMesh = new THREE.Mesh(lampGeometry, floorLampMaterial)
    const lampPostHeight = 6
    lampMesh.position.setX(lampWidth)
    lampMesh.position.setY(lampPostHeight/2)
    const lampPostGeometry = new THREE.BoxGeometry(lampDepth,lampPostHeight,lampWidth)
    const lampPostMesh = new THREE.Mesh(lampPostGeometry,floorLampMaterial)
    floorLampGroup.add(light,lampMesh, lampPostMesh)
    return floorLampGroup
}

function createCarMesh() {
    const carHeight = 1
    const carGeometry = new THREE.BoxGeometry(carHeight, carHeight, carHeight);
    const carMaterial = new THREE.MeshPhongMaterial({ color: "#327fa8" });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);
    carMesh.position.y = carHeight
    return carMesh;
}
