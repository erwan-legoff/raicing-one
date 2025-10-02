import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.80665, 0)
})
const scene = new THREE.Scene();
const cannonDebugger = new CannonDebugger(scene, world)
function animate() {
    renderer.render(scene, camera);
    world.fixedStep()
    // cannonDebugger.update()
    syncMeshesAndBodies();
    updateCar();
}

const camParam = {
    fieldOfView: 75,
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
let CONTROLS_PRESSED = []
window.addEventListener("keydown", function (e) {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

window.addEventListener("keydown", (event) => {
    if (!CONTROLS_PRESSED.includes(event.code)) {
        CONTROLS_PRESSED.push(event.code)
    }
});

window.addEventListener("keyup", (event) => {
    CONTROLS_PRESSED = CONTROLS_PRESSED.filter((code) => code != event.code)
});
const camera = new THREE.PerspectiveCamera(camParam.fieldOfView, camParam.aspectRatio, camParam.nearClip, camParam.farClip)
camera.position.z = 5
camera.position.y = 2
camera.rotateX(0)

const renderer = new THREE.WebGLRenderer()
// setting the resolution
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = createLight();
scene.add(light)


const { carMesh, carBody, vehicle, wheelBodies, wheelMeshes } = createCar();
const ROAD_HEIGHT = 1
const ROAD_WIDTH = 4
const ROAD_DEPTH = 200
const { roadMesh, roadBody } = createRoad();
const roadMat = new CANNON.Material('road')
roadBody.material = roadMat
world.addContactMaterial(new CANNON.ContactMaterial(
  roadMat, 
  wheelBodies[0].material, 
  { friction: 1.0, restitution: 0 }
))
scene.add(roadMesh)
scene.add(carMesh);
scene.add(...wheelMeshes)
// roadBody.quaternion.setFromEuler(-Math.PI, 0, Math.PI/25)
world.addBody(roadBody)
vehicle.addToWorld(world)
renderer.setAnimationLoop(animate);

const floorLamp = createFloorLamp()
floorLamp.position.setX(-ROAD_WIDTH / 2)
scene.add(floorLamp)



function syncMeshesAndBodies() {
    carMesh.position.copy(carBody.position);
    carMesh.quaternion.copy(carBody.quaternion);
    roadMesh.position.copy(roadBody.position);
    roadMesh.quaternion.copy(roadBody.quaternion);
    wheelMeshes.forEach((mesh,i)=>{
        mesh.position.copy(wheelBodies[i].position);
        mesh.quaternion.copy(wheelBodies[i].quaternion)
    })
}

function updateCar() {
    const ENGINE_FORCE = 20;
    const STEERING_ANGLE = Math.PI / 4;
    if (CONTROLS_PRESSED.includes(CONTROLS.FORWARD)) {
        vehicle.setWheelForce(ENGINE_FORCE, 0);
        vehicle.setWheelForce(ENGINE_FORCE, 1);
    } else if (CONTROLS_PRESSED.includes(CONTROLS.BACKWARD)) {
        vehicle.setWheelForce(-ENGINE_FORCE / 2, 0);
        vehicle.setWheelForce(-ENGINE_FORCE / 2, 1);
    } else {
        vehicle.setWheelForce(0, 0);
        vehicle.setWheelForce(0, 1);
    }

    if (CONTROLS_PRESSED.includes(CONTROLS.LEFT)) {
        vehicle.setSteeringValue(STEERING_ANGLE, 0);
        vehicle.setSteeringValue(STEERING_ANGLE, 1);
    } else if (CONTROLS_PRESSED.includes(CONTROLS.RIGHT)) {
        vehicle.setSteeringValue(-STEERING_ANGLE, 0);
        vehicle.setSteeringValue(-STEERING_ANGLE, 1);
    } else {
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
    }
}

function createRoad() {
    const roadGeometry = new THREE.BoxGeometry(ROAD_WIDTH, ROAD_HEIGHT, ROAD_DEPTH);
    const roadMaterial = new THREE.MeshPhongMaterial({ color: "#424242ff" });
    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    const halfExtents = new CANNON.Vec3(ROAD_WIDTH / 2, ROAD_HEIGHT / 2, ROAD_DEPTH / 2)
    const roadBody = new CANNON.Body(
        {
            type: CANNON.Body.STATIC,
            shape: new CANNON.Box(halfExtents)
        }
    )
    roadBody.position.set(0, -ROAD_HEIGHT, 0);

    return { roadMesh, roadBody };
}

function createLight() {
    const lightColor = 0xFFFFFF;
    const lightIntensity = 0.5;
    const light = new THREE.DirectionalLight(lightColor, lightIntensity);
    light.position.set(-1, 2, 4);
    return light;
}

function createFloorLamp() {
    const lightColor = "rgba(255, 179, 0, 1)"
    const lightIntensity = 50
    const light = new THREE.PointLight(lightColor, lightIntensity)

    const lampDim = {
        x: 1,
        y: 0.3,
        z: 1
    }
    const postDim = {
        x: 0.3,
        y: 6,
        z: 0.3
    }
    light.position.setX(lampDim.x / 3)
    light.position.setY(-lampDim.y / 2 - 0.001)

    const floorLampMaterial = new THREE.MeshPhongMaterial({ reflectivity: 1, shininess: 75, specular: "#6c6f7fff" })
    const floorLampGroup = new THREE.Group()
    const lampGeometry = new THREE.BoxGeometry(lampDim.x, lampDim.y, lampDim.z)
    const lampMesh = new THREE.Mesh(lampGeometry, floorLampMaterial)
    lampMesh.add(light)

    lampMesh.position.setX(postDim.x)
    lampMesh.position.setY(postDim.y / 2)

    const lampPostGeometry = new THREE.BoxGeometry(postDim.x, postDim.y, postDim.z)
    const lampPostMesh = new THREE.Mesh(lampPostGeometry, floorLampMaterial)
    lampPostMesh.add(lampMesh)
    floorLampGroup.add(lampPostMesh)
    return floorLampGroup
}

function createCar() {
    const carHeight = 0.5
    const carWidth = 1
    const carLength = 2
    const carGeometry = new THREE.BoxGeometry(carLength, carHeight, carWidth);
    const carMaterial = new THREE.MeshPhongMaterial({ color: "#327fa8" });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);

    const halfExtents = new CANNON.Vec3(carLength / 2, carHeight / 2, carWidth / 2)
    const carBody = new CANNON.Body({
        mass: 120,
        shape: new CANNON.Box(halfExtents)
    })
    
    const down = new CANNON.Vec3(0, -1, 0)
    const wheelAxis = new CANNON.Vec3(0, 0, 1)
    const wheelSize = carHeight / 3
    const wheelShape = new CANNON.Sphere(wheelSize)

    const vehicle = new CANNON.RigidVehicle({
        mass: 150,
        chassisBody: carBody,
    })
    const wheelBodies = makeWheelBodies(wheelShape)
    const wheelGeometry = new THREE.SphereGeometry(wheelSize)
    const wheelMaterial = new THREE.MeshPhongMaterial({color:"#9e9e9e"})
    const wheelMeshes = makeWheelMeshes(wheelGeometry, wheelMaterial)
        
    addVehicleWheels(vehicle, wheelBodies, carHeight, wheelAxis, down, carLength, carWidth);
    
    carBody.position.y = carHeight * 4
    carBody.quaternion.setFromAxisAngle(down, Math.PI/2)
    return { carMesh, carBody, vehicle, wheelBodies, wheelMeshes };
}
function addVehicleWheels(vehicle, wheelBodies, carHeight, wheelAxis, down, carLength, carWidth) {
    vehicle.addWheel({
        body: wheelBodies[0],
        position: new CANNON.Vec3(-carLength / 2, -carHeight / 2, carWidth / 2),
        axis: wheelAxis,
        direction: down
    });
    vehicle.addWheel({
        body: wheelBodies[1],
        position: new CANNON.Vec3(-carLength / 2, -carHeight / 2, -carWidth / 2),
        axis: wheelAxis,
        direction: down
    });
    vehicle.addWheel({
        body: wheelBodies[2],
        position: new CANNON.Vec3(carLength / 2, -carHeight / 2, carWidth / 2),
        axis: wheelAxis,
        direction: down
    });

    vehicle.addWheel({
        body: wheelBodies[3],
        position: new CANNON.Vec3(carLength / 2, -carHeight / 2, -carWidth / 2),
        axis: wheelAxis,
        direction: down
    });
}

function getWheelBody(wheelShape) {
    const wheelPysicsMaterial = new CANNON.Material('wheel')
    return new CANNON.Body({
        shape: wheelShape,
        material: wheelPysicsMaterial,
        mass:1,
        angularDamping: 0.4
    });
}
function makeWheelBodies(shape, count = 4) {
  return Array.from({ length: count }, () => getWheelBody(shape))
}
function makeWheelMeshes(geometry, material, count = 4) {
  return Array.from({ length: count }, () => getWheelMesh(geometry, material))
}
function getWheelMesh(geometry, material){
    return new THREE.Mesh(geometry,material)
}

