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
  MeshTexture,
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
  "@arcgis/core/geometry/support/MeshTexture.js",
]);

// Initialize the WebScene with a predefined portal item
const webScene = new WebScene({
  portalItem: {
    id: "4b3a6453bfc44e8599ac59bef0820a50", // ID of the basemap
  },
});

// Create the SceneView and attach it to the container
const view = new SceneView({
  container: "viewDiv", // Container element in HTML
  map: webScene,        // Attach the WebScene
});
view.ui.add("menu", "top-right"); // Add UI menu to top-right

// Create a GraphicsLayer for 3D meshes with ground elevation
const graphicsLayer = new GraphicsLayer({
  elevationInfo: {
    mode: "on-the-ground" // Models will be placed on ground level
  },
});
view.map.add(graphicsLayer); // Add the graphics layer to the map

// Define the reference point for mesh creation
const point = new Point({
  x: 685870,
  y: 8972310,
  z: 0,
  spatialReference: SpatialReference.WebMercator, // Use Web Mercator coordinate system
});

// Create a basic mesh symbol with fill layer
const emptyMeshSymbol = new MeshSymbol3D({
  symbolLayers: [new FillSymbol3DLayer({})], // Empty fill layer for base mesh
});

// Create a simple box mesh for demonstration
const boxMesh = Mesh.createBox(point, {
  size: { width: 1, depth: 1, height: 10 }, // Box dimensions
  material: {
    color: [58, 38, 0, 1], // Brown color for the box
  },
});

// Create a graphic for the box mesh
const box = new Graphic({
  geometry: boxMesh,
  symbol: emptyMeshSymbol,
});

// Function to create a 3D pyramid mesh at a specified location
function createPyramid(location, { material, size }) {
  const { height, width, depth } = size;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  // Calculate origin point for the pyramid (offset from location)
  const origin = [location.x + 10, location.y, location.z];

  // Define vertex positions for the pyramid
  const position = [
    0,    0,    height,  // Apex (top point)
    -halfWidth, -halfDepth, 0,  // Bottom front-left
    halfWidth,  -halfDepth, 0,  // Bottom front-right
    halfWidth,   halfDepth, 0,  // Bottom back-right
    -halfWidth,  halfDepth, 0   // Bottom back-left
  ];

  // Define UV coordinates for texturing
  const uv = [0.5, 0, 0, 1, 1, 1, 0, 1, 1, 1];

  // Create the pyramid mesh with 4 triangular faces
  const pyramid = new Mesh({
    vertexSpace: new MeshLocalVertexSpace({ origin }),  // Define local coordinate system
    vertexAttributes: { position, uv },  // Assign vertex positions and UV coordinates
    components: [
      { faces: [0, 1, 2], material },  // Front face
      { faces: [0, 2, 3], material },  // Right face
      { faces: [0, 3, 4], material },  // Back face
      { faces: [0, 4, 1], material },  // Left face
    ],
    spatialReference: location.spatialReference,  // Maintain spatial reference
  });

  return pyramid;
}

// Create a pyramid mesh with specified dimensions and material
const pyramidMesh = createPyramid(point, {
  size: { width: 7, depth: 7, height: 6 },  // Pyramid dimensions
  material: new MeshMaterial({
    color: [60, 87, 49, 1],  // Green color for the pyramid
  }),
});

// Create a graphic for the pyramid mesh
const pyramid = new Graphic({
  geometry: pyramidMesh,
  symbol: emptyMeshSymbol,
});

// Create a tree-like structure by merging multiple meshes
const treeMesh = meshUtils.merge([
  boxMesh.clone().offset(10, 0, 10),  // Base box
  pyramidMesh.clone().offset(0, 0, 20),  // First pyramid level
  pyramidMesh.clone().offset(0, 0, 22).scale(0.75),  // Second pyramid level (smaller)
  pyramidMesh.clone().offset(0, 0, 24).scale(0.5),  // Third pyramid level (smallest)
]);

// Create a graphic for the tree mesh
const tree = new Graphic({
  geometry: treeMesh,
  symbol: emptyMeshSymbol,
});

// Add initial meshes to the graphics layer
graphicsLayer.addMany([box, pyramid, tree]);

// Function to duplicate a mesh multiple times with random offsets
/**
 * Duplicate a mesh multiple times with random offsets.
 * 
 * @param {Mesh} mesh - The mesh to duplicate.
 * @param {number} amount - The number of duplicates to create.
 * @param {number} extentX - The maximum X offset.
 * @param {number} extentY - The maximum Y offset.
 */
function duplicateModels(mesh, amount, extentX, extentY) {
  // Clear existing graphics
  graphicsLayer.removeAll();
  
  // Create specified number of duplicates with random positioning
  for (let i = 0; i < amount; i++) {
    let tree = new Graphic({
      geometry: mesh
        .clone()  // Clone the original mesh
        .offset(
          -(Math.floor(Math.random() * extentX) - Math.random() * extentX),  // Random X offset
          -(Math.floor(Math.random() * extentY) - Math.random() * extentY),  // Random Y offset
          0  // No Z offset
        ),
      symbol: emptyMeshSymbol,  // Apply the base symbol
    });
    graphicsLayer.add(tree);  // Add to graphics layer
  }
}

// UI controls for mesh edges
const meshEdges = document.getElementById("meshEdges");
const needleCanvas = drawNeedleTexture();

// Handle edge style changes
meshEdges.addEventListener("calciteSwitchChange", (e) => {
  let edges;
  if (meshEdges.checked) {
    edges = new SketchEdges3D({
      color: [35, 47, 32, 1],
      size: 2,
    });
  } else {
    edges = new SolidEdges3D({
      color: [35, 47, 32, 1],
      size: 2,
    });
  }

  // Update edge style for all graphics
  let meshSymbol = new MeshSymbol3D({
    symbolLayers: [
      new FillSymbol3DLayer({
        edges: edges,
      }),
    ],
  });

  graphicsLayer.graphics.forEach((graphic) => {
    graphic.symbol = meshSymbol;
  });
});

// UI controls for mesh texture
const meshTexture = document.getElementById("meshTexture");

// Handle texture toggle
meshTexture.addEventListener("calciteSwitchChange", (e) => {
  graphicsLayer.graphics.forEach((graphic) => {
    const mesh = graphic.geometry;
    mesh.components.forEach((meshComponent) => {
      if (meshTexture.checked) {
        meshComponent.material.colorTexture = new MeshTexture({
          data: needleCanvas,
        });
      } else {
        meshComponent.material.colorTexture = null;
      }
    });
    mesh.vertexAttributesChanged();
  });
});

// Function to create a texture with needle-like patterns
function drawNeedleTexture() {
  // Create canvas and get 2D context
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  
  // Fill canvas with white background
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  // Define needle properties
  const needleColor = "#5b7b54";  // Green color for needles
  const needleWidth = 4;           // Width of each needle
  const needleHeight = 7;          // Height of each needle
  const spacing = 4;               // Spacing between needles

  // Draw needles in a grid pattern with random variations
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

  return canvas;  // Return the canvas with needle texture
}

// UI controls for workflow steps
let stepperMenu = document.getElementById("stepperMenu");

// Handle workflow step changes
stepperMenu.addEventListener("calciteStepperChange", () => {
  // Handle Create step
  if (stepperMenu.selectedItem.heading === "Create") {
    // Clear existing graphics and add base meshes
    graphicsLayer.removeAll();
    graphicsLayer.addMany([box.clone(), pyramid.clone()]);
    // Enable Modify step, disable Style step
    stepperMenu.children[2].setAttribute("disabled", "");
    stepperMenu.children[1].removeAttribute("disabled");
  }
  // Handle Modify step
  else if (stepperMenu.selectedItem.heading === "Modify") {
    // Clear existing graphics and reset amount slider
    graphicsLayer.removeAll();
    amountSlider.value = 1;
    // Enable both Create and Style steps
    stepperMenu.children[2].removeAttribute("disabled");
    stepperMenu.children[1].removeAttribute("disabled");
  }
  // Handle Style step
  else if (stepperMenu.selectedItem.heading === "Style") {
    // Update mesh style with solid edges
    graphicsLayer.graphics.forEach((graphic) => {
      graphic.symbol = new MeshSymbol3D({
        symbolLayers: [
          new FillSymbol3DLayer({
            edges: new SolidEdges3D({
              color: [35, 47, 32, 1],
              size: 2,
            }),
          }),
        ],
      });
    });
    // Reset UI controls
    meshEdges.checked = false;
    meshTexture.checked = false;
    stepperMenu.children[0].setAttribute("disabled", "");
    stepperMenu.children[1].removeAttribute("disabled");
  }
});
