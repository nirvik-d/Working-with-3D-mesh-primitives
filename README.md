# Working with 3D Mesh Primitives

A web application that demonstrates how to create and manipulate custom 3D mesh primitives using ArcGIS JavaScript API.

## Features

* **Custom Mesh Creation:** Create 3D pyramids and trees from scratch
* **Mesh Manipulation:** Duplicate and position meshes randomly
* **Texture Support:** Apply custom needle-like textures
* **Edge Styling:** Toggle between sketch and solid edges
* **Workflow Steps:** Organized creation, modification, and styling steps

## Screenshot

1. The main application
   <img width="959" alt="image" src="https://github.com/user-attachments/assets/79cc173d-6137-4445-a2ca-295f7c856eb2" />

## Prerequisites

* Node.js
* Vite

## Project Setup

1. **Initialize Project**

    ```bash
    npm create vite@latest
    ```

    Follow the instructions on screen to initialize the project.

2. **Install Dependencies**

    ```bash
    npm install
    ```

## Code Structure

### HTML Structure

The HTML file sets up the basic structure for the ArcGIS web application:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    <title>Working with 3D mesh primitives</title>

    <script type="module" src="https://js.arcgis.com/calcite-components/3.2.1/calcite.esm.js"></script>
    <link rel="stylesheet" href="https://js.arcgis.com/4.33/esri/themes/light/main.css" />
    <script src="https://js.arcgis.com/4.33/"></script>

    <link rel="stylesheet" href="./src/style.css" />
  </head>
  <body>
    <div id="viewDiv"></div>

    <calcite-panel theme="light" scale="s" id="menu">
      <h3 class="heading" slot="header-content">Working with 3D mesh primitives</h3>
      <calcite-stepper id="stepperMenu" numbered layout="horizontal" scale="m">
        <calcite-stepper-item heading="Create" selected>
          <div class="explanation">
            To create some models you first need to add primitive shapes. You can either use the
            predefined one (as for the box) or create it yourself by defining the vertices (as for
            the pyramid).
          </div>
        </calcite-stepper-item>
        <calcite-stepper-item heading="Modify">
          <div class="explanation">
            Later you need to combine the individual meshes into a single one. You can offset,
            rotate, scale or clone them to place them in desired positions.
          </div>
          <calcite-label alignment="center" layout="default" scale="m">
            Number of trees
            <calcite-slider id="amountSlider" value="1" label-handles label-ticks min="1" max="30">
            </calcite-slider>
          </calcite-label>
        </calcite-stepper-item>
        <calcite-stepper-item heading="Style" disabled>
          <div class="explanation">
            Finally, you can style the whole mesh as well as specific components. You can apply
            different colors and textures and style the edges.
          </div>
          <calcite-label layout="inline">
            <calcite-switch id="meshEdges"></calcite-switch>
            Sketch edges
          </calcite-label>
          <calcite-label layout="inline">
            <calcite-switch id="meshTexture"></calcite-switch>
            Texture
          </calcite-label>
        </calcite-stepper-item>
      </calcite-stepper>
    </calcite-panel>

    <script type="module" src="./src/main.js"></script>
  </body>
</html>

```

### JavaScript Structure

The main JavaScript file demonstrates 3D mesh creation and manipulation:

```javascript
// Import ArcGIS modules needed for 3D mesh creation
const [
  WebScene,
  Graphic,
  SceneView,
  Mesh,
  Point,
  SpatialReference,
  meshUtils,
  FillSymbol3DLayer,
  MeshSymbol3D,
  MeshMaterial,
  MeshLocalVertexSpace,
  GraphicsLayer,
  SketchEdges3D,
  SolidEdges3D,
  MeshTexture
] = await $arcgis.import([
  "@arcgis/core/WebScene.js",
  "@arcgis/core/Graphic.js",
  "@arcgis/core/views/SceneView.js",
  "@arcgis/core/geometry/Mesh.js",
  "@arcgis/core/geometry/Point.js",
  "@arcgis/core/geometry/SpatialReference.js",
  "@arcgis/core/geometry/support/meshUtils.js",
  "@arcgis/core/symbols/FillSymbol3DLayer.js",
  "@arcgis/core/symbols/MeshSymbol3D.js",
  "@arcgis/core/geometry/support/MeshMaterial.js",
  "@arcgis/core/geometry/support/MeshLocalVertexSpace.js",
  "@arcgis/core/layers/GraphicsLayer.js",
  "@arcgis/core/symbols/edges/SketchEdges3D.js",
  "@arcgis/core/symbols/edges/SolidEdges3D.js",
  "@arcgis/core/geometry/support/MeshTexture.js"
]);

// Initialize the WebScene
const webScene = new WebScene({
  portalItem: {
    id: "4b3a6453bfc44e8599ac59bef0820a50"
  }
});

// Create the SceneView
const view = new SceneView({
  container: "viewDiv",
  map: webScene
});
view.ui.add("menu", "top-right");

// Create a GraphicsLayer for 3D meshes
const graphicsLayer = new GraphicsLayer({
  elevationInfo: { mode: "on-the-ground" }
});
view.map.add(graphicsLayer);

// Create reference point
const point = new Point({
  x: 685870,
  y: 8972310,
  z: 0,
  spatialReference: SpatialReference.WebMercator
});

// Create base mesh symbol
const emptyMeshSymbol = new MeshSymbol3D({
  symbolLayers: [new FillSymbol3DLayer({})]
});

// Create box mesh
const boxMesh = Mesh.createBox(point, {
  size: { width: 1, depth: 1, height: 10 },
  material: {
    color: [58, 38, 0, 1]
  }
});

// Create pyramid mesh
const pyramidMesh = createPyramid(point, {
  size: { width: 7, depth: 7, height: 6 },
  material: new MeshMaterial({
    color: [60, 87, 49, 1]
  })
});

// Create graphics for base meshes
const box = new Graphic({
  geometry: boxMesh,
  symbol: emptyMeshSymbol
});

const pyramid = new Graphic({
  geometry: pyramidMesh,
  symbol: emptyMeshSymbol
});

// Create tree mesh by merging multiple meshes
const treeMesh = meshUtils.merge([
  boxMesh.clone().offset(10, 0, 10),
  pyramidMesh.clone().offset(0, 0, 20),
  pyramidMesh.clone().offset(0, 0, 22).scale(0.75),
  pyramidMesh.clone().offset(0, 0, 24).scale(0.5)
]);

// Create tree graphic
const tree = new Graphic({
  geometry: treeMesh,
  symbol: emptyMeshSymbol
});

// Add initial meshes to graphics layer
graphicsLayer.addMany([box, pyramid, tree]);

// Function to create pyramid mesh
function createPyramid(location, { material, size }) {
  const { height, width, depth } = size;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const origin = [location.x + 10, location.y, location.z];

  const position = [
    0,    0,    height,
    -halfWidth, -halfDepth, 0,
    halfWidth,  -halfDepth, 0,
    halfWidth,   halfDepth, 0,
    -halfWidth,  halfDepth, 0
  ];

  const uv = [0.5, 0, 0, 1, 1, 1, 0, 1, 1, 1];

  return new Mesh({
    vertexSpace: new MeshLocalVertexSpace({ origin }),
    vertexAttributes: { position, uv },
    components: [
      { faces: [0, 1, 2], material },
      { faces: [0, 2, 3], material },
      { faces: [0, 3, 4], material },
      { faces: [0, 4, 1], material }
    ],
    spatialReference: location.spatialReference
  });
}

// Function to duplicate meshes
function duplicateModels(mesh, amount, extentX, extentY) {
  graphicsLayer.removeAll();
  for (let i = 0; i < amount; i++) {
    let graphic = new Graphic({
      geometry: mesh
        .clone()
        .offset(
          -(Math.floor(Math.random() * extentX) - Math.random() * extentX),
          -(Math.floor(Math.random() * extentY) - Math.random() * extentY),
          0
        ),
      symbol: emptyMeshSymbol
    });
    graphicsLayer.add(graphic);
  }
}

// Function to draw needle texture
function drawNeedleTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = "#fff";
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

// Event handlers
const meshEdges = document.getElementById("meshEdges");
const needleCanvas = drawNeedleTexture();
meshEdges.addEventListener("calciteSwitchChange", (e) => {
  let edges;
  if (meshEdges.checked) {
    edges = new SketchEdges3D({
      color: [35, 47, 32, 1],
      size: 2
    });
  } else {
    edges = new SolidEdges3D({
      color: [35, 47, 32, 1],
      size: 2
    });
  }

  const meshSymbol = new MeshSymbol3D({
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

const meshTexture = document.getElementById("meshTexture");
meshTexture.addEventListener("calciteSwitchChange", (e) => {
  graphicsLayer.graphics.forEach((graphic) => {
    const mesh = graphic.geometry;
    mesh.components.forEach((meshComponent) => {
      if (meshTexture.checked) {
        meshComponent.material.colorTexture = new MeshTexture({
          data: needleCanvas
        });
      } else {
        meshComponent.material.colorTexture = null;
      }
    });
    mesh.vertexAttributesChanged();
  });
});

const stepperMenu = document.getElementById("stepperMenu");
const amountSlider = document.getElementById("amountSlider");
amountSlider.addEventListener("calciteSliderChange", () => {
  duplicateModels(treeMesh, amountSlider.value, 120, 120);
});

stepperMenu.addEventListener("calciteStepperChange", () => {
  if (stepperMenu.selectedItem.heading === "Create") {
    graphicsLayer.removeAll();
    graphicsLayer.addMany([box.clone(), pyramid.clone()]);
    stepperMenu.children[2].setAttribute("disabled", "");
    stepperMenu.children[1].removeAttribute("disabled");
  } else if (stepperMenu.selectedItem.heading === "Modify") {
    graphicsLayer.removeAll();
    amountSlider.value = 1;
    stepperMenu.children[2].removeAttribute("disabled");
    stepperMenu.children[1].removeAttribute("disabled");
  } else if (stepperMenu.selectedItem.heading === "Style") {
    graphicsLayer.graphics.forEach((graphic) => {
      graphic.symbol = new MeshSymbol3D({
        symbolLayers: [
          new FillSymbol3DLayer({
            edges: new SolidEdges3D({
              color: [35, 47, 32, 1],
              size: 2
            })
          })
        ]
      });
    });
    meshEdges.checked = false;
    meshTexture.checked = false;
    stepperMenu.children[0].setAttribute("disabled", "");
    stepperMenu.children[1].removeAttribute("disabled");
  }
});
```
```

### CSS Structure

```css
html,
body,
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}

calcite-panel {
  width: 330px;
  height: 380px;
}

calcite-stepper {
  padding: 1rem;
}

calcite-label {
  margin: auto;
}

calcite-slider {
  width: 10rem;
}

.explanation {
  padding: 1rem;
}
```

### Running the Application

1. For development, run:
```bash
npm run dev
```

The application can then be run on `https://localhost:5173`

2. For production, run:
```bash
npm run build
npm run preview
```
