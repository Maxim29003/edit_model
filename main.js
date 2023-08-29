import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import * as dat from 'dat.gui';



let scene, camera, renderer, orbitControls
let lights = [];
let elements = [];
const guiLight = new dat.GUI();
const guiElement = new dat.GUI();
const canvas = document.getElementById('main_canvas')

const mainLight = new THREE.PointLight(0xffffff, 1000);
mainLight.position.set(20, 20, 20); 

let isMainLight = false

init()
animate()

function  init () {
  // Создание сцены
scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff)
scene.fog = new THREE.Fog(0xffffff, 0, 500)
scene.add(new THREE.GridHelper(1000, 1000))
// Создание камеры
camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
camera.position.z = 10;
camera.position.x = 10;
camera.position.y = 10;

// Создание рендерера
renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio)

orbitControls = new OrbitControls(camera, canvas)

// Создание меню
const guiLightContainer = document.getElementById("gui-light-container");
const guiElementContainer = document.getElementById("gui-element-container");

guiLightContainer.appendChild(guiLight.domElement);
guiElementContainer.appendChild(guiElement.domElement);

guiLight.add({ 'Add Light': addLight }, 'Add Light');
guiElement.add({ 'Add Element': addElement }, 'Add Element');


// Загрузка элементов и света если они есть 
if (dataJson){
  if (dataJson.lights){
    for (const light of dataJson.lights) {
      const newLight = createLight(
        light.color, 
        light.object.matrix[12], 
        light.object.matrix[13], 
        light.object.matrix[14], 
        light.object.intensity, 
        light.object.distance
        )
      createMenuForLight(newLight.light, newLight.control)
    }
  }
 
  if (dataJson.elements){
    for (const element of dataJson.elements) {
      const newElement = createElement(
        element.materials[0].color,
        element.object.matrix[12], 
        element.object.matrix[13], 
        element.object.matrix[14],
        element.geometries[0].radius,
        element.object.userData
        )
        createMenuForElement(newElement.element, newElement.control)
    }
    
  }
}

// загрузка модели obj
if (path_model){
  const loader = new OBJLoader();

loader.load(
  path_model,
  (object) => {
    scene.add(object)
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% загружено');
  },
  (error) => {
    console.error('Ошибка загрузки модели', error);
  }
);
}
scene.add(mainLight)
}

// Создание элемента 
function createElement(color, x, y, z, radius, textData=null){
  const elementGeometry = new THREE.SphereGeometry(radius, 32, 32); 
  const elementMaterial = new THREE.MeshStandardMaterial({ color: color });
  const element = new THREE.Mesh(elementGeometry, elementMaterial);
  if (textData){
    element.userData = textData
  }
  element.position.set(x, y, z);
  scene.add(element);

  const control = new TransformControls( camera, canvas );
	
  control.addEventListener( 'dragging-changed', function ( event ) {
    orbitControls.enabled = ! event.value;
  } );

  control.attach(element)
  scene.add(control)
  return {element, control}
}

// Создание Света
function createLight(color, x, y, z, intensity, distance){
  const light = new THREE.PointLight(color, intensity, distance);
  light.position.set(x, y, z);
  scene.add(light);
 
  const control = new TransformControls( camera, canvas );
	
  control.addEventListener( 'dragging-changed', function ( event ) {
    orbitControls.enabled = ! event.value;
  } );

  control.attach(light)
  scene.add(control)
  return {light , control}
}


function createMenuForElement(element, control){
  const elementFolder = guiElement.addFolder(`Element ${elements.length}`);
  elementFolder.add(element.position, 'x', -2, 2).step(0.1).name('Position X');
  elementFolder.add(element.position, 'y', -2, 2).step(0.1).name('Position Y');
  elementFolder.add(element.position, 'z', -2, 2).step(0.1).name('Position Z');

  let textData = element.userData

  if (!textData.message) {
    textData.message = ''
  }
  if (!textData.url) {
    textData.url = ''
  }
 
  elementFolder.add(textData, "message").name("Text Message");
  elementFolder.add(textData, "url").name("Url");
  elementFolder.addColor(element.material, 'color').name('Color');

  element.userData = textData
  elementFolder.add({ Remove: () => remove(element, control, elementFolder, guiElement ) }, 'Remove').name('Remove');
  elements.push(element);
}


function createMenuForLight(light, control){
  const lightFolder = guiLight.addFolder(`Light ${lights.length} `);
  lightFolder.add(light.position, 'x', -2, 2).step(0.1).name('Position X');
  lightFolder.add(light.position, 'y', -2, 2).step(0.1).name('Position Y');
  lightFolder.add(light.position, 'z', -2, 2).step(0.1).name('Position Z');
  lightFolder.add(light, 'intensity', 0, 2).step(0.1).name('Intensity');
  lightFolder.addColor(light, 'color').name('Color');
  lightFolder.add({ Remove: () => remove(light, control, lightFolder, guiLight) }, 'Remove').name('Remove');
  lights.push(light);
}

function addElement() {
  const addNewElement = createElement(0x00ff00, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2, 0.5)
  createMenuForElement(addNewElement.element, addNewElement.control)
}

function remove(object, control, folder, gui) {
  scene.remove(control);
  control.dispose();
  scene.remove(object);
  if (lights.includes(object)){
    lights.splice(lights.indexOf(object), 1);
  }else{
    elements.splice(elements.indexOf(object), 1);
  }
  gui.removeFolder(folder)
  gui.updateDisplay();
}

function addLight() {
  const addNewLight = createLight(0xffffff, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2, 0.5, 10)
  createMenuForLight(addNewLight.light, addNewLight.control)
}

function createJSON(){
  const json = {
    'lights': lights,
    'elements':elements,
  };
  return json;
}

// кнопка сохранить 
const buttonSave = document.getElementById('button-save')
buttonSave.onclick = () => {
  console.log('save')
  const res = createJSON()
  console.log(res)
}

// кнопка света 
const buttonLight = document.getElementById('button-light')
buttonLight.onclick = () => {
  if (!isMainLight){
    scene.remove(mainLight)
    isMainLight = true
  }else{
    scene.add(mainLight)
    isMainLight = false
  }
}

function animate() {
    requestAnimationFrame(animate);
    orbitControls.update()
    renderer.render(scene, camera);
};

