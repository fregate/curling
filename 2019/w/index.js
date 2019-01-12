///<reference path="scripts/babylon.max.js" />

// Converts from degrees to radians.
Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

var theWall;
var sledgeMesh;
var treeMesh;
var lastTreeMeshZPosition = 0;
var treeOffset = 7;

var meshInstanses = 0;

var currentSpeed = 0.01;
var speedIncrement = 0.002;
var currentSledgeSpeed = 0;
var speedSledgeIncrement = 0.1;

var treeName = "tr";
var starName = "star";
var giftName = "gift";

var shadowGenerator;

function meshInstantinate(mesh, name, pos, rot, s) {
    var m = mesh.createInstance(name + meshInstanses++);
    m.parent = treeMesh;
    m.position = pos;
    m.rotation = rot;
    m.scaling.scaleInPlace(s);
    m.checkCollisions = true;
    theWall.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            {
                trigger: BABYLON.ActionManager.OnIntersectionExitTrigger,
                parameter: m
            },
            function (evt) {
                evt.additionalData.dispose();
            }
        )
    );
    return m;
}

function createTreeRow(scene, offsetZ) {
    var mr = scene.getMeshByName("tree0" + Math.ceil(Math.random() + .5));
    var mi = meshInstantinate(mr, treeName, new BABYLON.Vector3(-treeOffset, 10, offsetZ), new BABYLON.Vector3(0, Math.PI / 3, 0), .8);
    shadowGenerator.addShadowCaster(mi);

    var ml = scene.getMeshByName("tree0" + Math.ceil(Math.random() + .5));
    mi = meshInstantinate(ml, treeName, new BABYLON.Vector3(treeOffset, 10, offsetZ), new BABYLON.Vector3(0, Math.PI / 3, 0), .8);
    shadowGenerator.addShadowCaster(mi);
}

function init() {
    //Init the engine
    var engine = initEngine();
    //Create a new scene
    var scene = createScene(engine);
    scene.collisionsEnabled = true;

    /****************************Key Control Multiple Keys************************************************/

    var map = {}; //object for multiple key presses
    scene.actionManager = new BABYLON.ActionManager(scene);

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        map[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    scene.registerAfterRender(function () {
        if (sledgeMesh == null)
            return;

        if ((map["q"] || map["Q"])) {
            sledgeMesh.rotation.y = clamp(sledgeMesh.rotation.y + Math.PI / 36, -Math.PI / 2 + Math.PI / 8, Math.PI / 2 - Math.PI / 8);
            currentSledgeSpeed = speedSledgeIncrement * Math.sin(sledgeMesh.rotation.y);
        } else if ((map["E"] || map["e"])) {
            sledgeMesh.rotation.y = clamp(sledgeMesh.rotation.y - Math.PI / 36, -Math.PI / 2 + Math.PI / 8, Math.PI / 2 - Math.PI / 8);
            currentSledgeSpeed = speedSledgeIncrement * Math.sin(sledgeMesh.rotation.y);
        };
    });

    scene.registerBeforeRender(function () {
        treeMesh.moveWithCollisions(new BABYLON.Vector3(0, 0, -currentSpeed));
        sledgeMesh.moveWithCollisions(new BABYLON.Vector3(currentSledgeSpeed, 0, 0));

        if (lastTreeMeshZPosition - treeMesh.position.z < 2)
            return;

        lastTreeMeshZPosition = treeMesh.position.z;

        createTreeRow(scene, 36 - treeMesh.position.z);

        // increase speed
        currentSpeed = clamp(currentSpeed + speedIncrement * Math.cos(sledgeMesh.rotation.y), 0, 1);
    });
}

function initEngine() {
    // Get the canvas element from index.html
    var canvas = document.getElementById("renderCanvas");
    // Initialize the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    return engine;
}

function createScene(engine) {
    var scene = new BABYLON.Scene(engine);
    scene.shadowsEnabled = true;
    var light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, -1), scene);
    light.position = new BABYLON.Vector3(10, 10, 30);
    light.setDirectionToTarget(new BABYLON.Vector3(0, 0, 0));
    light.specular = new BABYLON.Color3(0, 0, 0);
    light.intensity = 1.7;

    var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(0, -1, -1), scene);
    light2.position = new BABYLON.Vector3(-10, 70, -30);
    light2.setDirectionToTarget(new BABYLON.Vector3(0, 0, 0));
    light2.specular = new BABYLON.Color3(0, 0, 0);
    light2.intensity = 1.5;

    shadowGenerator = new BABYLON.ShadowGenerator(2048, light2);
    shadowGenerator.useVarianceShadowMap = true;
    shadowGenerator.blurBoxOffset = 2.0;

    var camera = createCamera(scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    var canvas = document.getElementById("renderCanvas");
    let ratio = canvas.width / canvas.height;
    let zoom = 20;
    let width = zoom * ratio;
    camera.orthoTop = zoom;
    camera.orthoLeft = -width;
    camera.orthoRight = width;
    camera.orthoBottom = -zoom - 5 * ratio;

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        let ratio = canvas.width / canvas.height;
        let width = zoom * ratio;
        camera.orthoTop = zoom;
        camera.orthoLeft = -width;
        camera.orthoRight = width;
        camera.orthoBottom = -zoom - 5 * ratio;
        engine.resize();
    });
    //camera.attachControl(document.getElementById("renderCanvas"), false);

    // Assets manager
    var assetsManager = new BABYLON.AssetsManager(scene);

    var sledgeTask = assetsManager.addMeshTask("sledge mesh", "", "./assets/", "sledge.babylon");
    sledgeTask.onSuccess = function (task) {
        sledgeMesh = task.loadedMeshes[0];
        sledgeMesh.position = new BABYLON.Vector3(0, 0, -5);
        sledgeMesh.checkCollisions = true;

        sledgeMesh.onCollide = function (cm) {
            if (cm.name.startsWith(starName)) {
                // pick star (reduce speed by half)
            } else if (cm.name.startsWith(giftName)) {
                // pick gift (increase points)
            } else if (cm.name.startsWith(treeName)) {
                // hit a tree - game over
                sledgeMesh.position.x -= currentSledgeSpeed * 10;
            }
        };

        shadowGenerator.addShadowCaster(sledgeMesh);
    }

    var t = assetsManager.addMeshTask("trees", "", "./assets/", "trees.babylon");
    t.onSuccess = function (task) {
        task.loadedMeshes.forEach(function (mesh, idx, arr) {
            mesh.position = new BABYLON.Vector3(0, -10, 0);
        });
    }

    var g = assetsManager.addMeshTask("gifts", "", "./assets/", "gifts.babylon");
    g.onSuccess = function (task) {
        task.loadedMeshes.forEach(function (mesh, idx, arr) {
            mesh.convertToFlatShadedMesh();
            mesh.position = new BABYLON.Vector3(0, -10, 0);
        });
    }

    // But you can also do it on the assets manager itself (onTaskSuccess, onTaskError)
    assetsManager.onTaskError = function (task) {
        console.log("error while loading " + task.name);
    }

    assetsManager.onFinish = function (tasks) {
        // create start scene
        for (var i = -8; i <= 36; i += 2) {
            createTreeRow(scene, treeMesh.position.z + i);
        }

        currentSledgeSpeed = 0;
        currentSpeed = 0.01;

        engine.runRenderLoop(function () {
            scene.render();
        });
    };

    // Can now change loading background color:
    engine.loadingUIBackgroundColor = "Purple";

    // Just call load to initiate the loading sequence
    assetsManager.load();

    var floor = BABYLON.MeshBuilder.CreateGround("floor", { width: 200, height: 400, subdivisions: 1, updatable: false }, scene);
    var snowMaterial = new BABYLON.StandardMaterial(name, scene);
    snowMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    snowMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    floor.material = snowMaterial;
    floor.receiveShadows = true;
    //floor.visibility = 0;

    treeMesh = BABYLON.MeshBuilder.CreateBox("dummy", {}, scene);
    treeMesh.position.y = -10;
    lastTreeMeshZPosition = treeMesh.position.z;

    theWall = BABYLON.MeshBuilder.CreatePlane("theWall", { sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true, width: treeOffset * 4, height: 1 }, scene);
    theWall.position = new BABYLON.Vector3(0, 0, -30);
    theWall.checkCollisions = true;
    theWall.actionManager = new BABYLON.ActionManager(scene);
    return scene;
}

function createCamera(scene) {
    var camera = new BABYLON.ArcRotateCamera(cameraName, Math.PI / 2, Math.PI / 6, 70, new BABYLON.Vector3(0, 0, 0), scene);
    return camera;
}

function clamp(value, vmin, vmax) {
    return Math.min(vmax, Math.max(vmin, value));
}
