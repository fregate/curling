///<reference path="scripts/babylon.max.js" />

// Converts from degrees to radians.
Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

var sledgeMesh;
var treeMesh;
var lastTreeMeshZPosition = 0;
var treeInstances = 0;

var speedIncrement = 0.01; // speed = currentSpeed + speedIncrement * Math.cos(sledge.rotation.y);

function createTreeRow(scene, offsetZ) {
    var mr = scene.getMeshByName("tree0" + Math.ceil(Math.random() + .5));
    var mir = mr.createInstance("itr" + treeInstances);
    mir.parent = treeMesh;
    mir.position = new BABYLON.Vector3(-5, 10, offsetZ);
    mir.rotation = new BABYLON.Vector3(0, Math.PI / 3, 0);
    mir.scaling.scaleInPlace(.8);

    treeInstances++;

    var ml = scene.getMeshByName("tree0" + Math.ceil(Math.random() + .5));
    var mil = ml.createInstance("itr" + treeInstances);
    mil.parent = treeMesh;
    mil.position = new BABYLON.Vector3(5, 10, offsetZ);
    mil.rotation = new BABYLON.Vector3(0, Math.PI / 3, 0);
    mil.scaling.scaleInPlace(.8);

    treeInstances++;
}

function init() {
    //Init the engine
    var engine = initEngine();
    //Create a new scene
    var scene = createScene(engine);

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
//            mainMesh.material.diffuseColor.copyFromFloats(Math.random(), Math.random(), Math.random());
        } else if ((map["E"] || map["e"])) {
            sledgeMesh.rotation.y = clamp(sledgeMesh.rotation.y - Math.PI / 36, -Math.PI / 2 + Math.PI / 8, Math.PI / 2 - Math.PI / 8);
//            mainMesh.material.diffuseColor.copyFromFloats(Math.random(), Math.random(), Math.random());
        };
    });

    scene.registerBeforeRender(function () {
        treeMesh.position.z -= speedIncrement;

        if (lastTreeMeshZPosition - treeMesh.position.z < 2)
            return;

        lastTreeMeshZPosition = treeMesh.position.z;

        createTreeRow(scene, 32 - treeMesh.position.z);
    });

/*
    var showAxis = function (size) {
        var makeTextPlane = function (text, color, size) {
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color, "transparent", true);
            var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
            plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
            plane.material.backFaceCulling = false;
            plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
            plane.material.diffuseTexture = dynamicTexture;
            return plane;
        };

        var axisX = BABYLON.Mesh.CreateLines("axisX", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
            new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
        ], scene);
        axisX.color = new BABYLON.Color3(1, 0, 0);
        var xChar = makeTextPlane("X", "red", size / 10);
        xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
        var axisY = BABYLON.Mesh.CreateLines("axisY", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
            new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
        ], scene);
        axisY.color = new BABYLON.Color3(0, 1, 0);
        var yChar = makeTextPlane("Y", "green", size / 10);
        yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
        var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
            new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
            new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
        ], scene);
        axisZ.color = new BABYLON.Color3(0, 0, 1);
        var zChar = makeTextPlane("Z", "blue", size / 10);
        zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
    };
    showAxis(7);
    */
}

function initEngine() {
    // Get the canvas element from index.html
    var canvas = document.getElementById("renderCanvas");
    // Initialize the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });

    return engine;
}

function createScene(engine) {
    var scene = new BABYLON.Scene(engine);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-1, 1, 1), scene);
    light.groundColor = new BABYLON.Color3(1, 1, 1);

//    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);

    engine.enableOfflineSupport = false;

    var camera = createCamera(scene);
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    camera.orthoTop = 20;
    camera.orthoBottom = -25;
    camera.orthoLeft = -20;
    camera.orthoRight = 20;

//  camera.attachControl(document.getElementById("renderCanvas"), false);

    // Assets manager
    var assetsManager = new BABYLON.AssetsManager(scene);

    var sledgeTask = assetsManager.addMeshTask("sledge mesh", "", "./assets/", "sledge.babylon");
    // You can handle success and error on a per-task basis (onSuccess, onError)
    sledgeTask.onSuccess = function (task) {
        sledgeMesh = task.loadedMeshes[0];
        sledgeMesh.position = new BABYLON.Vector3(0, 0, -5);
    }

    var t = assetsManager.addMeshTask("trees", "", "./assets/", "trees.babylon");
    t.onSuccess = function (task) {
        task.loadedMeshes.forEach(function (mesh, idx, arr) {
            mesh.position = new BABYLON.Vector3(0, -10, 0);
        });
    }

    // But you can also do it on the assets manager itself (onTaskSuccess, onTaskError)
    assetsManager.onTaskError = function (task) {
        console.log("error while loading " + task.name);
    }

    assetsManager.onFinish = function (tasks) {
        // create start scene
        for (var i = -8; i < 34; i += 2) {
            createTreeRow(scene, treeMesh.position.z + i);
        }

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
    floor.material = snowMaterial;
    floor.receiveShadows = true;
    //floor.visibility = 0;

    treeMesh = BABYLON.MeshBuilder.CreateBox("dummy", {}, scene);
    treeMesh.position.y = -10;
    var dm = new BABYLON.StandardMaterial("dm_M", scene);
    dm.diffuseColor = new BABYLON.Color3(1, 0, 1);
    treeMesh.material = dm;
    lastTreeMeshZPosition = treeMesh.position.z;

    scene.debugLayer.show();
    return scene;
}

function createCamera(scene) {
    var camera = new BABYLON.ArcRotateCamera("cam", Math.PI / 2, Math.radians(30), 70, new BABYLON.Vector3(0, 0, 0), scene);
    return camera;
}

function clamp(value, vmin, vmax) {
    return Math.min(vmax, Math.max(vmin, value));
}
