var canvas, gl
var bunny;
var vBuffer;
var program;
var uMatrix;
var cube;
var cone;

window.onload = function init(){
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    if(!gl){
        alert( "WebGL isn't available" );
    }
    //bunny
    bunny = new Bunny(get_vertices(), get_faces());
    //cube
    cube = new Cube (cubeVer([5,5,0], 0.2), [5, 5, 0]);
    //cone
    cone = new Cone(coneVer([0, -2 / 7, -1 / 7], 0.1) );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    //normal buffer
    var normalBuffer = gl.createBuffer();    
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    //cube normal
    var cubN = cubeNorm(cube.getVers());
    //cone normal
    var coneN = cubeNorm(cone.getVers());
    //all normals
    var n = bunny.getNormal();
    console.log("what is bunny normal now: ", n)
    n = n.concat(cubN);
    n = n.concat(coneN);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(n), gl.STATIC_DRAW);
    var normalLocation = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLocation);

    //all vertices 
    var all = bunny.getVers();
    console.log("what is bunny vertices now: ", all, "face :", bunny.getFaceLen())
    all = all.concat(cube.getVers());
    all = all.concat(cone.getVers());
    //position buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(all), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    initData();

    render();
}

function initData(){
    var viewMatrix = gl.getUniformLocation(program, "viewMatrix");
    var eye = vec3(0, 0, 10);
    var at = vec3(0, 0, 0);
    var up = vec3(0, 1, 0);
    var mv = lookAt(eye, at, up);

    gl.uniformMatrix4fv(viewMatrix, false, flatten(mv))
    
    var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    projectionMatrix = perspective(60, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.3, 1000);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix))

    uMatrix = gl.getUniformLocation(program, "uMatrix");

    var viewWorldPosition = gl.getUniformLocation(program, "viewWorldPosition");
    gl.uniform3fv(viewWorldPosition, eye);

    var ka = gl.getUniformLocation(program, "Ka");
    var kd = gl.getUniformLocation(program, "Kd");
    var ks = gl.getUniformLocation(program, "Ks");
    gl.uniform1f(ka, 0.7);
    gl.uniform1f(kd, 1.0);
    gl.uniform1f(ks, 1.0);

    var shiness = gl.getUniformLocation(program, "shininessVal");
    gl.uniform1f(shiness, 150.0);

    var lightAmbient = gl.getUniformLocation(program, "ambientColor");
    var lightDiffuse = gl.getUniformLocation(program, "diffuseColor");
    var lightSpecular = gl.getUniformLocation(program, "specularColor");

    gl.uniform3fv(lightAmbient, [0.25, 0.2, 0.05]);
    gl.uniform3fv(lightDiffuse, [0.83, 0.71, 0.21]);
    gl.uniform3fv(lightSpecular, [0.9, 0.9, 0.9]);
}

window.oncontextmenu = function(event){
    event.preventDefault();
}

window.addEventListener("mousedown", getClick, false)

function getClick(button){
    //console.log("it is clicked")
    switch(button.button){
        case 0:
            bunny.mouseClick(1, "left");
            var  x= -1 + 2 * event.clientX / canvas.width;
            var  y= -1 + 2 * (canvas.height - event.clientY) / canvas.height;
            bunny.updateLocationXY(x, y);
            break;
        case 2:
            bunny.mouseClick(1, "right");
            //console.log("right clicked\n")
            var  x= -1 + 2 * event.clientX / canvas.width;
            var  y= -1 + 2 * (canvas.height - event.clientY) / canvas.height;
            //console.log("x and y", x, y ,"\n")
            bunny.updateLocationXY(x, y);   
            break; 
    }
}
window.addEventListener("keydown", getKey, false)

function getKey(key){
    switch(key.key){
        case "ArrowUp":
            bunny.translate_bunnyZ(+1.2);
            break;
        case "ArrowDown":
            bunny.translate_bunnyZ(-1.2);
            break;
        case "p":
            if(cube.getStop() == 0)
                cube.setStop(1)
            else if(cube.getStop() == 1)
                cube.setStop(0)        
            break;
        case "r":        
            bunny.reset();
            break;
        case "s":
            if(cone.getStop() == 0)
                cone.setStop(1)
            else if(cone.getStop() == 1)
                cone.setStop(0)        
            break;    
    }
}


window.addEventListener("mouseup", unClick, false)

function unClick(){
    //console.log("it is unclicked")
    bunny.mouseClick(0, "left");
    bunny.mouseClick(0, "right"); 
}

window.addEventListener("mousemove", moveMouse, false)

function moveMouse(){
    //console.log("it is clicked")
    var  x = -1 + 2 * event.clientX / canvas.width;
    var  y = -1 + 2 * (canvas.height - event.clientY) / canvas.height;
    if(bunny.getMouseClick("left")){
        bunny.translate_bunnyXY(x, y);
    }
    if(bunny.getMouseClick("right")){
        //console.log("right click move!\n")
        var  x = -1 + 2 * event.clientX / canvas.width;
        var  y = -1 + 2 * (canvas.height - event.clientY) / canvas.height;
        bunny.rotateBunny(x, y);
    } 
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //draw bunny
    var transformMatrix = mat4();
    transformMatrix = mult(transformMatrix, rotateX(bunny.getRotation()[0]));
    transformMatrix = mult(transformMatrix, rotateY(bunny.getRotation()[1]));
    transformMatrix = mult(transformMatrix, translateMatrix(bunny.getTranslation()[0], bunny.getTranslation()[1], bunny.getTranslation()[2]));
    gl.uniformMatrix4fv(uMatrix, false, flatten(transformMatrix));

    var worldInverseTranspose = gl.getUniformLocation(program, "worldInverseTranspose");
    //console.log("uMatrix is :", transformMatrix)
    var invers = inverse(transformMatrix);
    //console.log("inverse uMatrix is :", invers)
    var transpos = transpose(invers);
   
    gl.uniformMatrix4fv(worldInverseTranspose, false, flatten(transpos));
    //gl.clear( gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0,  3 * bunny.getFaceLen());

    var pointLightWorldPosition = gl.getUniformLocation(program, "pointLightWorldPosition");

    //draw cube
    transformMatrix = mat4();
    if(cube.getStop() == 0)
        cube.rotate(1);
    transformMatrix = mult(transformMatrix, rotateY(cube.getRotation()[0]));

    gl.uniformMatrix4fv(uMatrix, false, flatten(transformMatrix));
    var p = mult(transformMatrix, vec4(5, 5, 0, 1));
    gl.uniform3fv(pointLightWorldPosition, [p[0], p[1], p[2]]);
    gl.drawArrays(gl.LINES, 3* bunny.getFaceLen() , 24);

    //draw cone
    transformMatrix = mat4();
    // console.log("what is rotation for cone: ", cone.getRotation()[0])
    // console.log("what is flag for cone: ", cone.getFlag())
    if(cone.getStop() == 0){
        if(cone.getRotation()[0] == 100 || cone.getRotation()[0] == -100)
            cone.setFlag();
        if(cone.getFlag() > 0)
            cone.rotate(-1);
        else 
            cone.rotate(+1);
    }
    //spot light
    var spotLightDirection = gl.getUniformLocation(program, "spotLightDirection");
    var lmat = lookAt([0, 4, 2], [0, 0, 0], [0, 1, 0]);
    lmat = mult(lmat, rotateY(- cone.getRotation()[0]));
    //console.log("what is lmat: ", lmat)
    var lightDirection = [-lmat[2][0],-lmat[2][1], -lmat[2][2]]
    gl.uniform3fv(spotLightDirection, lightDirection);
    var spotLimit = gl.getUniformLocation(program, "spotLimit");
    var limit = radians(15);
    //console.log("what is the limit: ", limit, '\n', "what is cosine limit: ", Math.cos(limit))
    gl.uniform1f(spotLimit, Math.cos(limit));
    var spotLightWorldPosition = gl.getUniformLocation(program, "spotLightWorldPosition");
    gl.uniform3fv(spotLightWorldPosition, [0, 4, 2]);
    //

    transformMatrix = mult(transformMatrix, translateMatrix(cone.getTranslation()[0], cone.getTranslation()[1], cone.getTranslation()[2]));
    transformMatrix = mult(transformMatrix, rotateY(cone.getRotation()[0]));
    gl.uniformMatrix4fv(uMatrix, false, flatten(transformMatrix));
    gl.drawArrays(gl.LINES, 3* bunny.getFaceLen() + 24 , 24);

    window.requestAnimFrame(render); 
}

function translateMatrix(x, y, z){
    return mult(mat4(), translate(x, y, z));
}

function normal(v1, v2, v3){
    var l1 = subtract(v2, v1);
    var l2 = subtract(v3, v1);
    var n = cross(l1, l2);
    return normalize(n);
}
class Bunny{
    constructor(vertices, faces){
        // this.vertices = this.setVers(vertices, faces);
        this.faces = get_faces();
        this.facesLen = faces.length
        this.flat_vertices = flatten(vertices);
        this.flat_faces = flatten(faces).map(element => {
            return element -= 1;    
        });
        this.vertices = this.setVers(vertices, faces);
        this.translation = [0, 0, 0];
        this.mouseClickL = 0;
        this.mouseClickR = 0;
        this.location = [0, 0, 0];
        this.rotation = [0, 0];
        //this.normal = this.setNormal(vertices, faces);
        this.smoothNormal = this.setSmoothNormal(vertices, faces);
    }
    reset(){
        this.translation = [0, 0, 0];
        this.location = [0, 0, 0];
        this.rotation = [0, 0];
    }
    getFaceLen(){
        return this.facesLen;
    }
    getVers(){
        return this.vertices;
    }
    setVers(vertices, faces){
        var result = [];
        this.flat_faces.forEach(each => {
            result.push(vertices[each])
        });
        return result;
    }
    setSmoothNormal(vertices, faces){
        var result = [];
        var s = vertices.map(each =>{
            return vec3(0, 0, 0);
        });
        //console.log("what is s: ", s)
        faces.forEach(each => {
            var v1 = vertices[each[0] -1];
            var v2 = vertices[each[1] -1];
            var v3 = vertices[each[2] -1];
            var n = normal(v1, v2, v3);
            //console.log("what is normal and v1 :", n, s[each[0] - 1])
            s[each[0] - 1] = add(s[each[0] - 1], n)
            s[each[1] - 1] = add(s[each[1] -1], n)
            s[each[2] - 1] = add(s[each[2] -1], n)
        });
        this.flat_faces.forEach(each => {
            result.push(normalize(s[each]));
        });
        return result;
    }
    // setNormal(vertices, faces){
    //     var result = [];
    //     faces.forEach(each => {
    //         var v1 = vertices[each[0] -1];
    //         var v2 = vertices[each[1] -1];
    //         var v3 = vertices[each[2] -1];
    //         var n = normal(v1, v2, v3);
    //         result.push(n, n, n);
    //     });
        
    //     return result;
    // }
    get flat_ver() {
        return this.flat_vertices;
    }
    get flat_fac(){
        return this.flat_faces;
    }
    getNormal(){
        return this.smoothNormal;
    }
    updateLocationXY(x, y){
        this.location[0] = x;
        this.location[1] = y;
    }
    updateLocationZ(z){
        this.location[2] = z;
    }
    getLocation(){
        return this.location;
    }
    translate_bunnyXY(x, y){
        this.translation[0] += (x - this.location[0]) * 5;
        this.translation[1] += (y - this.location[1]) * 5;
        this.updateLocationXY(x, y);
    }
    translate_bunnyZ(z){
        this.translation[2] += z;
        this.updateLocationZ(this.translation[2]);
    }
    rotateBunny(x, y){
        var yDist = (this.location[1] - y);
        var xDist = (this.location[0] - x);
        this.rotation[1] += xDist * 360
        this.rotation[0] += yDist * 360
        //console.log("it is in rotateBunny: x, y: ",this.rotation[0], this.rotation[1] )
        this.updateLocationXY(x, y);
    }
    getRotation(){
        return this.rotation;
    }

    getTranslation(){
        return this.translation;
    }

    mouseClick(n, lOrR){
        if(lOrR == "left")
            this.mouseClickL = n;
        if(lOrR == "right")
            this.mouseClickR = n;    
    }

    getMouseClick(lOrR){
        if(lOrR == "left")
            return this.mouseClickL;
        if(lOrR == "right")
            return this.mouseClickR;  
    }
}

class Cube extends Bunny{
    constructor(vertices, location){
        super(vertices, []);
        this.vertices = vertices;
        this.location = location;
        this.rotation = [0];
        this.stop = 0;
    }
    rotate(x){
        this.rotation[0] += x;
    }
    setStop(n){
        this.stop = n;
    }
    getStop(){
        return this.stop;
    }

}
class Cone extends Cube{
    constructor(vertices){
        super(vertices, []);
        this.vertices = vertices;
        this.translation = [0, 4, 2];
        this.rotation = [0];
        this.stop = 0;
        this.flag = 1;
    }
    setFlag(){
        this.flag = -this.flag;
    }
    getFlag(){
        return this.flag;
    }
}
function coneVer(v, l){
    var vers = []
    var top = vec3(0, 0, 0);
    var v1 = v; //left up
    var v2 = vec3(v[0] + l, v[1], v[2]); //right up
    var v3 = vec3(v1[0] - l / 2, v1[1] - l / 2 , v[2] + l / 2 ); //middle left
    var v4 = vec3(v2[0] + l / 2, v2[1] - l / 2 , v[2] + l / 2 ); //middle right
    var v5 = vec3(v1[0], v1[1] - l, v[2] + l); //left bottom
    var v6 = vec3(v2[0], v2[1] - l, v[2] + l); //right front bottom
    vers.push(top, v1, top, v2, top, v3, top, v4, top, v5, top, v6);
    vers.push(v1, v2, v2, v4, v4, v6, v6, v5, v5, v3, v3, v1)
    return vers;
}
function cubeVer(v, l){
    var vers = []
    var v1 = v; //left front top
    var v2 = vec3(v[0] + l, v[1], v[2]); //right front top
    var v3 = vec3(v2[0], v2[1] , v2[2] - l); //right back top
    var v4 = vec3(v1[0], v1[1] , v3[2]); //left back top
    var v5 = vec3(v1[0], v1[1] - l, v1[2]); //left front bottom
    var v6 = vec3(v2[0], v5[1], v2[2]); //right front bottom
    var v7 = vec3(v6[0], v6[1], v3[2]); //right back bottom
    var v8 = vec3(v5[0], v5[1], v7[2]); //left back bottom
    vers.push(v1, v2, v2, v3, v3, v4, v4, v1, v1, v5, v5, v8, v8, v4, v7, v8, v3, v7, v6, v7, v6, v2);
    vers.push(v6, v5);
    return vers;
}

function cubeNorm(v){
    var result = v.map(each => {
        return [0, 0, 0];
    })
    //console.log("result: ", result);
    return result;
}

/*
La: ambient light energy
ka: ambient reflection coefficient (a material property)

Ld: diffuse term of light source
kd: material's diffuse reflection coefficient
n: normal vector at point(normalized)
l: light source vector(normalized)

alpha: shiness parameter
v: point to eye
r: reflection vector
r = 2* (n dot v) - I 
phong model = I = ka * La + kd * Ld (l dot n) + ks * Ls (v dot r) to power ofalpha
*/