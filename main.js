import * as THREE from 'three'

function animate() {
    cubeMesh.rotateX(0.01)
    cubeMesh.rotateY(0.01)
    renderer.render(scene, camera);
}

const scene = new THREE.Scene();
const camParam = {
    fiedOfView: 75,
    aspectRatio: window.innerWidth / window.innerHeight,
    nearClip: 0.1,
    farClip: 1000

}
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