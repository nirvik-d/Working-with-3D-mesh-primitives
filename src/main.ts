import "./style.css";

import "@arcgis/map-components/components/arcgis-scene";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-navigation-toggle";
import "@arcgis/map-components/components/arcgis-compass";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-stepper";
import "@esri/calcite-components/components/calcite-stepper-item";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-slider";
import "@esri/calcite-components/components/calcite-switch";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Mesh from "@arcgis/core/geometry/Mesh";
import MeshSymbol3D from "@arcgis/core/symbols/MeshSymbol3D";
import FillSymbol3DLayer from "@arcgis/core/symbols/FillSymbol3DLayer";
import MeshMaterial from "@arcgis/core/geometry/support/MeshMaterial";
import MeshTexture from "@arcgis/core/geometry/support/MeshTexture";
import MeshLocalVertexSpace from "@arcgis/core/geometry/support/MeshLocalVertexSpace";
import Point from "@arcgis/core/geometry/Point";
import SpatialReference from "@arcgis/core/geometry/SpatialReference";
import SolidEdges3D from "@arcgis/core/symbols/edges/SolidEdges3D";
import SketchEdges3D from "@arcgis/core/symbols/edges/SketchEdges3D";
import * as meshUtils from "@arcgis/core/geometry/support/meshUtils";
import Color from "@arcgis/core/Color";

const scene = document.querySelector("arcgis-scene");
if (!scene) {
  throw new Error("Scene element not found");
}

await scene.viewOnReady();
const view = scene.view;

view.ui.add("menu", "top-right"); // Add UI menu to top-right

const graphicsLayer: GraphicsLayer = new GraphicsLayer({
  elevationInfo: {
    mode: "on-the-ground",
  },
});
view.map?.add(graphicsLayer);

// Create a mesh
// Select a placement point
const point: Point = new Point({
  x: 685870,
  y: 8972310,
  z: 0,
  spatialReference: SpatialReference.WebMercator,
});

// Create a base mesh symbol
const emptyMeshSymbol: MeshSymbol3D = new MeshSymbol3D({
  symbolLayers: [new FillSymbol3DLayer({})],
});

// Create a box
const boxMesh: Mesh = Mesh.createBox(point, {
  size: { width: 1, depth: 1, height: 10 },
  material: {
    color: new Color([58, 38, 0, 1]),
  } as MeshMaterial,
});

const boxGraphic: Graphic = new Graphic({
  geometry: boxMesh,
  symbol: emptyMeshSymbol,
});

// Add the box to the graphics layer
graphicsLayer.add(boxGraphic);

// Create a pyramid
function createPyramid(
  location: Point,
  {
    material,
    size,
  }: {
    material: MeshMaterial;
    size: { width: number; depth: number; height: number };
  }
) {
  const { height, width, depth } = size;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const origin: number[] = [
    (location.x + 10) as number,
    location.y as number,
    location.z as number,
  ];

  const position: number[] = [
    0,
    0,
    height,
    -halfWidth,
    -halfDepth,
    0,
    halfWidth,
    -halfDepth,
    0,
    halfWidth,
    halfDepth,
    0,
    -halfWidth,
    halfDepth,
    0,
  ];

  const uv: number[] = [0.5, 0, 0, 1, 1, 1, 0, 1, 1, 1];

  return new Mesh({
    vertexSpace: new MeshLocalVertexSpace({ origin }),
    vertexAttributes: { position, uv },
    components: [
      { faces: [0, 1, 2], material },
      { faces: [0, 2, 3], material },
      { faces: [0, 3, 4], material },
      { faces: [0, 4, 1], material },
    ],
    spatialReference: location.spatialReference,
  });
}

const pyramidMesh: Mesh = createPyramid(point, {
  material: {
    color: new Color([60, 87, 49, 1]),
  } as MeshMaterial,
  size: { width: 7, depth: 7, height: 6 },
});

const pyramidGraphic: Graphic = new Graphic({
  geometry: pyramidMesh,
  symbol: emptyMeshSymbol,
});

// Add meshes to the graphics layer
graphicsLayer.add(pyramidGraphic);

// Modify the meshes
// Modify the mesh to a tree
const treeMesh: Mesh = meshUtils.merge([
  boxMesh.clone().offset(10, 0, 10),
  pyramidMesh.clone().offset(0, 0, 20),
  pyramidMesh.clone().offset(0, 0, 22).scale(0.75),
  pyramidMesh.clone().offset(0, 0, 24).scale(0.5),
]) as Mesh;

const treeGraphic: Graphic = new Graphic({
  geometry: treeMesh,
  symbol: emptyMeshSymbol,
});

// Render the trees randomly across the map
const amountSlider: HTMLCalciteSliderElement | null =
  document.querySelector("#amountSlider");
if (!amountSlider) {
  throw new Error("Amount slider not found");
}
amountSlider.addEventListener("calciteSliderChange", () => {
  duplicateModels(treeMesh, amountSlider.value as number, 120, 120);
});

function duplicateModels(
  mesh: Mesh,
  amount: number,
  extentX: number,
  extentY: number
) {
  graphicsLayer.removeAll();
  for (let i = 0; i < amount; i++) {
    let treeGraphic: Graphic = new Graphic({
      geometry: mesh
        .clone()
        .offset(
          -(Math.floor(Math.random() * extentX) - Math.random() * extentX),
          -(Math.floor(Math.random() * extentY) - Math.random() * extentY),
          0
        ),
      symbol: emptyMeshSymbol,
    });
    graphicsLayer.add(treeGraphic);
  }
}


// Styling the mesh
// Styling the edges
const meshEdges: HTMLCalciteSwitchElement | null = document.querySelector("#meshEdges");
if (!meshEdges) {
  throw new Error("Mesh edges switch not found");
}
const needleCanvas = drawNeedleTexture();

meshEdges.addEventListener("calciteSwitchChange", () => {
  let edges: SolidEdges3D | SketchEdges3D;
  if(meshEdges.checked){
    edges = new SolidEdges3D({
      color: new Color([35, 47, 32, 1]),
      size: 2,
    });
  }else{
    edges = new SketchEdges3D({
      color: new Color([35, 47, 32, 1]),
      size: 2,
    });
  }

  let meshSymbol: MeshSymbol3D = new MeshSymbol3D({
    symbolLayers: [
      new FillSymbol3DLayer({
        edges: edges
      })
    ]
  });

  graphicsLayer.graphics.forEach((graphic) => {
    graphic.symbol = meshSymbol;
  });
});

// Add the textures
const meshTexture: HTMLCalciteSwitchElement | null = document.querySelector("#meshTexture");
if (!meshTexture) {
  throw new Error("Mesh texture switch not found");
}
meshTexture.addEventListener("calciteSwitchChange", () => {
  graphicsLayer.graphics.forEach((graphic) => {
    const mesh: Mesh | null = graphic.geometry as Mesh;
    if(!mesh){
      throw new Error("Mesh not found");
    }
    mesh.components?.forEach((component: __esri.MeshComponent) => {
      if(meshTexture.checked && component.material){
        component.material.colorTexture = new MeshTexture({
          data: needleCanvas,
        });
      }else if(component.material){
        component.material.colorTexture = null;
      }
    });
    mesh.vertexAttributesChanged(); //Signal that the vertex attributes need to be recalculated
  });
});

function drawNeedleTexture(): HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  const w = canvas.width;
  const h = canvas.height;
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const needleColor = "#5b7b54";
  const needleWidth = 4;
  const needleHeight = 7;
  const spacing = 4;

  for (
    let y = 0;
    y < h;
    y += Math.random() * needleHeight + Math.random() * spacing
  ) {
    for (let x = 0; x < w; x += needleWidth + Math.random() * spacing) {
      ctx.fillStyle = needleColor;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(needleWidth / 2, Math.random() * needleHeight);
      ctx.lineTo(-needleWidth / 2, Math.random() * needleHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  return canvas;
}

// Setting up the menu
const stepperMenu: HTMLCalciteStepperElement | null = document.querySelector("#stepperMenu");
if (!stepperMenu) {
  throw new Error("Stepper menu not found");
}
stepperMenu.addEventListener("calciteStepperChange", () => {
  if(stepperMenu.selectedItem.heading === "Create"){
    graphicsLayer.removeAll();
    graphicsLayer.add(boxGraphic.clone());
    graphicsLayer.add(pyramidGraphic.clone());
    stepperMenu.children[2].setAttribute("disabled", "");
    stepperMenu.children[1].removeAttribute("disabled");
  }else if(stepperMenu.selectedItem.heading === "Modify"){
    graphicsLayer.removeAll();
    amountSlider.value = 1;
    graphicsLayer.add(treeGraphic.clone());
    stepperMenu.children[0].removeAttribute("disabled");
    stepperMenu.children[2].removeAttribute("disabled");
  }else if(stepperMenu.selectedItem.heading === "Style"){
    graphicsLayer.graphics.forEach((graphic) => {
      graphic.symbol = new MeshSymbol3D({
        symbolLayers: [new FillSymbol3DLayer({
          edges: new SolidEdges3D({
            color: new Color([35, 47, 32, 1]),
            size: 2,
          })
        })],
      });
    });
    meshEdges.checked = false;
    meshTexture.checked = false;
    stepperMenu.children[0].setAttribute("disabled", "");
    stepperMenu.children[1].removeAttribute("disabled");
  }
});

