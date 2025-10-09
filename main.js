import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';

const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.80665, 0)
})
const socket = new WebSocket("ws://localhost:8000/ai");
socket.onopen = () => {
    console.log("Connecté !");
};
const CONTROLS = {
    FORWARD: "ArrowUp",
    BACKWARD: "ArrowDown",
    LEFT: "ArrowLeft",
    RIGHT: "ArrowRight",
}
const AI_CONTROLS = {
    LEFT: CONTROLS.LEFT,
    FORWARD: CONTROLS.FORWARD,
    RIGHT: CONTROLS.RIGHT,
    BACKWARD: CONTROLS.BACKWARD,
};
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.driving_inputs) {
        CONTROLS_PRESSED = data.driving_inputs.map((aiInput) => {
            return AI_CONTROLS[aiInput]
        })
    }
};

socket.onclose = () => {
    console.log("Connexion fermée");
};

const scene = new THREE.Scene();
const cannonDebugger = new CannonDebugger(scene, world)
let first = true
const SEND_HZ = 1;
let lastSend = 0
function animate(ts) {

    renderer.render(scene, camera);
    world.fixedStep()
    // cannonDebugger.update()
    syncMeshesAndBodies();
    updateCar();
    if (ts - lastSend < 1000 / SEND_HZ) return;
    if (socket.readyState !== WebSocket.OPEN) return;
    // Gather intersections for all rays into an object keyed by ray name
    const rayIntersections = Object.fromEntries(Object.entries(rays).map(([name, ray]) => {
        // intersectObjects returns an array of Intersection objects

        const intersects = ray.raycaster.intersectObjects(scene.children, true)
        if (!intersects) return [name, 10000]
        if (!intersects.length) return [name, 10000]
        return [name, intersects[0].distance];
    }));

    socket.send(JSON.stringify(rayIntersections))
    lastSend = ts;


}

const carHeight = 0.5
const carWidth = 1
const carLength = 2

const CAM_PARAM = {
    fieldOfView: 75,
    aspectRatio: window.innerWidth / window.innerHeight,
    nearClip: 0.1,
    farClip: 1000
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


const camera = new THREE.PerspectiveCamera(CAM_PARAM.fieldOfView, CAM_PARAM.aspectRatio, CAM_PARAM.nearClip, CAM_PARAM.farClip)
window.addEventListener('resize', (_) => {
    camera.aspect = window.innerWidth / window.innerHeight
    renderer.setSize(window.innerWidth, window.innerHeight)
    camera.updateProjectionMatrix()
});

camera.position.z = 5
camera.position.y = 2
camera.rotateX(0)

const renderer = new THREE.WebGLRenderer()
// setting the resolution
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const light = createLight();
scene.add(light)

const wheelPhysicsMaterial = new CANNON.Material('wheel')
const { carMesh, carBody, vehicle, wheelBodies, wheelMeshes } = createCar();
const ROAD_HEIGHT = 1
const ROAD_WIDTH = 5
const ROAD_DEPTH = 1000
const { roadMesh, roadBody, leftWallMesh, rightWallMesh } = createRoad();
const roadMat = new CANNON.Material('road')

roadBody.material = roadMat
world.addContactMaterial(new CANNON.ContactMaterial(roadMat, wheelPhysicsMaterial
    , {
        friction: 1.0,
        restitution: 0,
    }))
scene.add(roadMesh)
scene.add(carMesh);
scene.add(leftWallMesh)
scene.add(rightWallMesh)
scene.add(...wheelMeshes)
// roadBody.quaternion.setFromEuler(-Math.PI, 0, Math.PI/25)
world.addBody(roadBody)
vehicle.addToWorld(world)
renderer.setAnimationLoop(animate);

const floorLamp = createFloorLamp()
floorLamp.position.setX(-ROAD_WIDTH / 2)
scene.add(floorLamp)


function createRay(localDirection, localOffset = new THREE.Vector3(), length = 5, color = 0xff0000) {
    const raycaster = new THREE.Raycaster();
    const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), length, color);
    arrowHelper.traverse(obj => { obj.raycast = () => { }; });

    const update = (mesh) => {
        const worldDirection = localDirection.clone().applyQuaternion(mesh.quaternion).normalize();
        const worldOrigin = mesh.position.clone().add(localOffset.clone().applyQuaternion(mesh.quaternion));

        raycaster.set(worldOrigin, worldDirection);
        arrowHelper.position.copy(worldOrigin);
        arrowHelper.setDirection(worldDirection);
    };

    return { raycaster, arrowHelper, update };
}


function createRayCasters() {
    const rayFrontDirection = new THREE.Vector3(-1, 0, 0);
    const rayFrontOffset = new THREE.Vector3(-carLength / 2, 0, 0);

    const { rayNarrow: leftNarrowRay, ray45: left45Ray, ray22: left22Ray } = createSideRays(rayFrontDirection);
    const { rayNarrow: rightNarrowRay, ray45: right45Ray, ray22: right22Ray } = createSideRays(rayFrontDirection, true);

    const frontRay = createRay(rayFrontDirection, rayFrontOffset);

    return {
        left45Ray,
        left22Ray,
        leftNarrowRay,
        frontRay,
        rightNarrowRay,
        right22Ray,
        right45Ray
    };
}

const rays = createRayCasters();

Object.values(rays).forEach(ray => {
    scene.add(ray.arrowHelper);
});




function createSideRays(rayFrontDirection, isRight = false) {
    const rotation = isRight ? -1 : 1
    const xOffset = -carLength / 2
    const zOffset = rotation * (carWidth / 2)
    const degToRad = Math.PI / 180;

    const rayNarrowDirection = rayFrontDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation * 8 * degToRad);
    const rayNarrowOffset = new THREE.Vector3(xOffset, 0, zOffset);
    const rayNarrow = createRay(rayNarrowDirection, rayNarrowOffset);

    const ray45Direction = rayFrontDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation * 45 * degToRad);
    const ray45Offset = new THREE.Vector3(xOffset, 0, zOffset);
    const ray45 = createRay(ray45Direction, ray45Offset);

    const ray22Direction = rayFrontDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation * 25 * degToRad);
    const ray22Offset = new THREE.Vector3(xOffset, 0, zOffset);
    const ray22 = createRay(ray22Direction, ray22Offset);


    return { rayNarrow, ray45, ray22 };
}


function syncMeshesAndBodies() {
    carMesh.position.copy(carBody.position);
    carMesh.quaternion.copy(carBody.quaternion);
    roadMesh.position.copy(roadBody.position);
    roadMesh.quaternion.copy(roadBody.quaternion);
    camera.position.z = carMesh.position.z + 5

    wheelMeshes.forEach((mesh, i) => {
        mesh.position.copy(wheelBodies[i].position);
        mesh.quaternion.copy(wheelBodies[i].quaternion)
    })

    Object.values(rays).forEach(ray => ray.update(carMesh))
}

function updateCar() {
    const ENGINE_FORCE = 40;
    const STEERING_ANGLE = Math.PI / 16;
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
    const roadBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(halfExtents) })
    roadBody.position.set(0, -ROAD_HEIGHT, 0);

    const leftWallMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    leftWallMesh.position.setX(-ROAD_WIDTH / 2)
    leftWallMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2)

    const rightWallMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    rightWallMesh.position.setX(ROAD_WIDTH / 2)
    rightWallMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2)

    return { roadMesh, roadBody, leftWallMesh, rightWallMesh };
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
    const down = new CANNON.Vec3(0, -1, 0)

    const carGeometry = new THREE.BoxGeometry(carLength, carHeight, carWidth);
    const carMaterial = new THREE.MeshPhongMaterial({ color: "#327fa8" });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);

    const halfExtents = new CANNON.Vec3(carLength / 2, carHeight / 2, carWidth / 2)
    const carBody = new CANNON.Body({
        mass: 120,
        shape: new CANNON.Box(halfExtents)
    })
    carBody.position.y = carHeight * 4



    const wheelAxis = new CANNON.Vec3(0, 0, 1)
    const wheelSize = carHeight / 3
    const wheelShape = new CANNON.Sphere(wheelSize)

    const vehicle = new CANNON.RigidVehicle({
        mass: 150,
        chassisBody: carBody,
    })
    const wheelBodies = makeWheelBodies(wheelShape)
    const wheelGeometry = new THREE.SphereGeometry(wheelSize)
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: "#9e9e9e" })
    const wheelMeshes = makeWheelMeshes(wheelGeometry, wheelMaterial)


    addVehicleWheels(vehicle, wheelBodies, carHeight, wheelAxis, down, carLength, carWidth);
    carBody.quaternion.setFromAxisAngle(down, Math.PI / 2)

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

    return new CANNON.Body({
        shape: wheelShape,
        material: wheelPhysicsMaterial,
        mass: 1,
        angularDamping: 0.4
    });
}
function makeWheelBodies(shape, count = 4) {
    return Array.from({ length: count }, () => getWheelBody(shape))
}
function makeWheelMeshes(geometry, material, count = 4) {
    return Array.from({ length: count }, () => getWheelMesh(geometry, material))
}
function getWheelMesh(geometry, material) {
    return new THREE.Mesh(geometry, material)
}

