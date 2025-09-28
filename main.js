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
    FORWARD:"ArrowUp",
    BACKWARD:"ArrowDown",
    LEFT:"ArrowLeft",
    RIGHT:"ArrowRight", 
}

window.addEventListener("keydown", (event) => {
    console.log(event.key)
    const STEP = 0.1
    switch (event.key) {
        case CONTROLS.FORWARD:
            cubeMesh.position.z -= STEP
            break;
        case CONTROLS.BACKWARD:
            cubeMesh.position.z += STEP
            break;
        case CONTROLS.LEFT:
            cubeMesh.position.x -= STEP
            break;
        case CONTROLS.RIGHT:
            cubeMesh.position.x += STEP
            break;
        default:
            break;
    }

});
const camera = new THREE.PerspectiveCamera(camParam.fiedOfView, camParam.aspectRatio, camParam.nearClip, camParam.farClip)

const renderer = new THREE.WebGLRenderer()
// setting the resolution
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubematerialM = new THREE.MeshBasicMaterial({ color: "#327fa8" })
const cubeMesh = new THREE.Mesh(cubeGeometry, cubematerialM)
scene.add(cubeMesh)

renderer.setAnimationLoop(animate);

camera.position.z = 5