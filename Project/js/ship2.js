
if ( ! Detector.webgl ) {
    Detector.addGetWebGLMessage();
    document.getElementById( 'container' ).innerHTML = "";
}
var container, stats;
var camera, scene, renderer;
var clock = new THREE.Clock();
var camControls;
var parameters = {
    width: 2000,
    height: 2000,
    widthSegments: 250,
    heightSegments: 250,
    depth: 1500,
    param: 4,
    filterparam: 1
};
var waterNormals;

init();
animate();
function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 3000000 );
    // camera.position.set( 2000, 750, 2000 );
    /*
     controls = new THREE.OrbitControls( camera, renderer.domElement );
     controls.enablePan = false;
     controls.minDistance = 1.0;
     controls.maxDistance = 50000.0;
     controls.maxPolarAngle = Math.PI * 0.495;
     controls.target.set( 0, 500, 0 );

     controls=new THREE.FlyControls(camera,renderer.domElement);
     controls.movementSpeed = 1000;
     controls.rollSpeed = Math.PI / 10;
     controls.autoForward=true;
     controls.dragToLook=false;*/

    camControls = new THREE.FirstPersonControls(camera);
    camControls.lookSpeed = 0.4;
    camControls.movementSpeed = 20;
    camControls.noFly = true;
    camControls.lookVertical = true;
    camControls.constrainVertical = true;
    camControls.verticalMin = 1.0;
    camControls.verticalMax = 2.0;
    camControls.lon = -150;
    camControls.lat = 120;



    scene.add( new THREE.AmbientLight( 0x444444 ) );
    var light = new THREE.DirectionalLight( 0xffffbb, 1 );
    light.position.set( - 1, 1, - 1 );
    scene.add( light );
    waterNormals = new THREE.TextureLoader().load( 'waternormals.jpg' );
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    water = new THREE.Water( renderer, camera, scene, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: waterNormals,
        alpha: 	1.0,
        sunDirection: light.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 50.0,
    } );
    mirrorMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( parameters.width * 500, parameters.height * 500 ),
        water.material
    );
    mirrorMesh.add( water );
    mirrorMesh.rotation.x = - Math.PI * 0.5;
    scene.add( mirrorMesh );
    // load skybox
    var cubeMap = new THREE.CubeTexture( [] );
    cubeMap.format = THREE.RGBFormat;
    var loader = new THREE.ImageLoader();
    loader.load( 'skyboxsun25degtest.png', function ( image ) {
        var getSide = function ( x, y ) {
            var size = 1024;
            var canvas = document.createElement( 'canvas' );
            canvas.width = size;
            canvas.height = size;
            var context = canvas.getContext( '2d' );
            context.drawImage( image, - x * size, - y * size );
            return canvas;
        };
        cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
        cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
        cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
        cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
        cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
        cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
        cubeMap.needsUpdate = true;
    } );
    var cubeShader = THREE.ShaderLib[ 'cube' ];
    cubeShader.uniforms[ 'tCube' ].value = cubeMap;
    var skyBoxMaterial = new THREE.ShaderMaterial( {
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    } );
    var skyBox = new THREE.Mesh(
        new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
        skyBoxMaterial
    );
    scene.add( skyBox );
    var material = new THREE.MeshPhongMaterial( {
        vertexColors: THREE.FaceColors,
        shininess: 100,
        envMap: cubeMap
    } );
}
var manager = new THREE.LoadingManager();
manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
};
var texture = new THREE.Texture();
var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
};
var onError = function ( xhr ) {
};
var loader = new THREE.ImageLoader( manager );
loader.load( 'obj/ship.jpg', function ( image ) {
    texture.image = image;
    texture.needsUpdate = true;
} );
// model
var loader = new THREE.OBJLoader( manager );
loader.load( 'obj/321.obj', function ( object1 ) {
    object1.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
            child.material.map = texture;
            render();
        }
    } );
    object1.position.y = -10;
    object1.position.x=-250;
    //renderer.render( scene, camera );
    object1.scale.x=object1.scale.y=object1.scale.z=0.02;
    scene.add( object1 );
}, onProgress, onError );
var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
};
var onError = function ( xhr ) { };
THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
var mtlLoader = new THREE.MTLLoader();
mtlLoader.setPath( 'obj/ship/' );
mtlLoader.load( 'fanchuan.mtl', function( materials ) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( 'obj/ship/' );
    objLoader.load( 'fanchuan.obj', function ( objectfunchuan ) {
        objectfunchuan.position.y = -15;
        objectfunchuan.position.x=+250;
        camera.position.y=+300;
        camera.position.x=250;
        camera.position.z=10;
        var time = performance.now() * 0.001;
        // object.position.z =  time  * 500 + 250;
        objectfunchuan.scale.x=objectfunchuan.scale.y=objectfunchuan.scale.z=0.02;
        document.addEventListener('keydown', function (event) {
            switch (event.keyCode) {
                case 65:
                    // alert('你按下了左');
                    // objectfunchuan.rotation.y += 1;
                    //  sphere.rotation.x = time * 0.5;
                    objectfunchuan.position.x+=10;
                    camera.position.x+=10;
                    event.preventDefault();
                    break;
                case 87:
                    // alert('你按下了上');

                    objectfunchuan.position.z+=15;
                    camera.position.z+=15;
                    var time = performance.now() * 0.001;
                    objectfunchuan.position.y=Math.sin(time)*4+4;
                    event.preventDefault();
                    break;
                case 68:
                    // alert('你按下了右');
                    //  DirectionalLight.visible=!false;
                    //alert('相机位置x'+camera.position.x+'\r\n相机位置y'+camera.position.y+'\r\n相机位置z'+camera.position.z);
                    objectfunchuan.position.x-=10;
                    camera.position.x-=10;
                    event.preventDefault();
                    break;
                case 83:
                    //  alert('你按下了下');
                    objectfunchuan.position.z-=20;
                    camera.position.z-=20;
                    event.preventDefault();
                    break;
            }
        }, false);
        scene.add( objectfunchuan );

        render();
    }, onProgress, onError );
});


function animate() {
    requestAnimationFrame( animate );
    render();
}
function render() {
    var time = performance.now() * 0.001;
    water.material.uniforms.time.value += 1.0 / 60.0;
    var delta = clock.getDelta();
    camControls.update(delta);
    water.render();

    renderer.render( scene, camera );
}