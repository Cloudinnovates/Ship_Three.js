
   // <iframe name="toppage" width=100% height=100% marginwidth=50 marginheight=50 frameborder="no" border="0"  src="shiyan2.html" ></iframe>
    if ( ! Detector.webgl ) {
        Detector.addGetWebGLMessage();
        document.getElementById( 'container' ).innerHTML = "";
    }
    //<audio src="/Mp3/BGM.mp3" controls="autoplay"></audio>
    var container, stats;
    var camera, scene, renderer;
    var Dirlight,Amlight,Splight;//定义平行光，环境光，点光
    var parameters = {
        width: 2000,//x方向长度
        height: 2000,//y方向长度
        widthSegments: 250,//x方向分段数
        heightSegments: 250,//z方向分段数
        depth: 1500,//设置水面距离相机的额位置，数字越大，海平面越远。（深度）
        param: 4,
        filterparam: 1
    };
    var waterNormals,info;
    init();
    animate();
    function init() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );
        renderer = new THREE.WebGLRenderer();//定义渲染器
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );
        scene = new THREE.Scene();//定义场景
        camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 0.5, 3000000 );
        camera.position.set( 266.42619955078914, 271.66231875732154, 3440.9940177949984 );//相机属性
        controls = new THREE.OrbitControls( camera, renderer.domElement );//相机中的轨道控件
        controls.enablePan = false;
        controls.minDistance = 1.0;
        controls.maxDistance = 50000.0;
        controls.maxPolarAngle = Math.PI * 0.495;
        controls.target.set( 0, 500, 0 );
        Amlight = new THREE.AmbientLight( 0x444444 );
        scene.add(Amlight);//添加环境光444444
        Dirlight = new THREE.DirectionalLight( 0xffffbb, 1 );//添加方向光，模拟阳光ffffbb
         Dirlight.position.set( - 1, 1, - 1 );
         scene.add( Dirlight );
        waterNormals = new THREE.TextureLoader().load( 'waternormals.jpg' );//给水面添加材质
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
        water = new THREE.Water( renderer, camera, scene, {
            textureWidth: 512,//为了达到最好的效果，最好使用正方形的图片，其长宽都是2的次方。
            textureHeight: 512,
            waterNormals: waterNormals,
            alpha: 	1.0,
            sunDirection: Dirlight.position.clone().normalize(),
            sunColor:0xffffff,//定义阳光光照颜色为白色，水面倒影的阳光颜色ffffff
            waterColor: 0x001e0f,//设置水体的颜色001e0f

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
        var cubeMap = new THREE.CubeTexture( [] );//创建一个CubeMap对象，一个CubeMap是一个具有6个纹理的集合
                                                       //
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
        var cubeShader = THREE.ShaderLib[ 'cube' ];//定义着色器，结合THREE.ShaderMaterial
        cubeShader.uniforms[ 'tCube' ].value = cubeMap;
        var skyBoxMaterial = new THREE.ShaderMaterial( {//将材质属性复制
            fragmentShader: cubeShader.fragmentShader,//片元着色器
            vertexShader: cubeShader.vertexShader,//顶点着色器
            uniforms: cubeShader.uniforms,
            depthWrite: false,
            side: THREE.BackSide/////////////////将原本属于Material的方法交给当前对象ShaderMaterial来使用.
        } );
        var skyBox = new THREE.Mesh(
                new THREE.BoxGeometry( 1000000, 1000000, 1000000 ),
                skyBoxMaterial//利用上面的ShaderMaterial以及CubeMap构建网格，加到场景中
        );
        scene.add( skyBox );
        document.addEventListener('keydown', function (event) {
            switch (event.keyCode) {
                case 76://敲击L
                    // alert('你按下了左');
                        scene.remove(skyBox);//移除天空盒，制造夜晚情景
                        Amlight.visible=false;//环境光，平行光不可见
                        Dirlight.visible=false;
                        alert('天黑了，请小心驾驶');
                        Splight=new THREE.SpotLight(0x444444 );
                        Splight.position.set(-200,500,200);
                        Splight.castShadow=true;
                        Splight.target=mirrorMesh;
                        scene.add(Splight);
                    break;
                case 75://敲击K
                    // alert('你按下了左');
                    scene.add(skyBox);
                    Amlight.visible=true;
                    Dirlight.visible=true;
                    scene.remove(Splight);
                    break;
            }
        }, false);
        var material = new THREE.MeshPhongMaterial( {
            vertexColors: THREE.FaceColors,
            shininess: 100,//高光的强度,, 数值越大,高光呈现出一个亮点.
            envMap: cubeMap//环境贴图
        } );
    }
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
            objectfunchuan.position.y -= 45;
            objectfunchuan.position.x=+250;
            var time = performance.now() * 0.01;
            objectfunchuan.scale.x=objectfunchuan.scale.y=objectfunchuan.scale.z=0.025;
            document.addEventListener('keydown', function (event) {
                switch (event.keyCode) {
                    case 65:
                        objectfunchuan.position.x+=10;
                        camera.position.x+=10;
                        event.preventDefault();
                        break;
                    case 87:
                        objectfunchuan.position.z+=15;
                        camera.position.z+=15;
                        var time = performance.now() * 0.001;
                        objectfunchuan.position.y=Math.sin(time)*4+4;
                        event.preventDefault();
                        break;
                    case 68:
                        objectfunchuan.position.x-=10;
                        camera.position.x-=10;
                        event.preventDefault();
                        break;
                    case 83:
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
        var time = performance.now() * 0.001;//获取时间
        water.material.uniforms.time.value += 1.0 / 60.0;//纹理多久变化一次，每变化一次，  water.render();渲染一次，
        controls.update();                                //实际上底部是一个动态的贴材质的过程。
        water.render();

        renderer.render( scene, camera );
    }
