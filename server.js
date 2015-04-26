var estructura = require('./json/json_bdd.js');
var twitter = require('./twitter/twitea');

var fabrizio=require('./gestionclientes.js')
, parser=require('./parser.js')
, datos
, express=require('express')
, app = express()
, server = require('http').createServer(app)
, io = require('socket.io').listen(server,{log: false })

, fs=require('fs')
, web
, final_web
, ascii=new Array()
, valores=new Array()
, n=0
, max_valor='';//String con valor maximo del intervalo. p.ej. si los valores permitidos son solo letras minusculas con long 8, seria "zzzzzzzz".

const PORT=8080
, DURACION_QUERYS=1 //En segundos. Mas de 1, mejor que no
, DURACION_CLAVES_SEG=10;//En segundos

/////////////////////////////////////////////////////////////////////////////

if (process.argv.length != 6){
    mierda();
}else if ((process.argv[2].substr(0,2) != "--") || ((process.argv[2].search('A') == -1) && (process.argv[2].search('a') == -1) && (process.argv[2].search('1') == -1) && (process.argv[2].search('%') == -1)) || (process.argv[3] != "-L") || (isNaN(parseInt(process.argv[4])))){
    mierda();
}else{
if (process.argv[2].search('1') != -1){
        for (var i=48; i<58;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
    }
    if (process.argv[2].search('a') != -1){
        for (var i=97; i<123;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
    }
    if (process.argv[2].search('A') != -1){
        for (var i=65; i<91;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
    }
    if (process.argv[2].search('%') != -1){
        for (var i=32; i<48;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
        for (var i=58; i<65;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
        for (var i=91; i<97;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
        for (var i=123; i<127;i++){
           valores.push(String.fromCharCode(i));//valores permitidos
           }
    }
for (var i=0; i<parseInt(process.argv[4]);i++){//Comienzo de la fuerza bruta
        ascii[i]=valores[0];
        max_valor+=valores[valores.length-1];
    }
setInterval(function(){muestra_cuenta();},DURACION_CLAVES_SEG*1000);//Timer
parser.leerCaptura(__dirname+"/"+process.argv[5], function(ld){
   datos=ld;
   });//Parsea el fichero. Se usa un callback por la ejecucion asincrona de nodejs
}


app.get('/',function(req, res){
  try{
    web=fs.readFileSync(__dirname+'/static_content/html/index.html','utf8');
  }catch(e){
    mierda();
  }
  res.send(web); //Se carga en memoria para poder modificarlo. Por eso no se usa sendfile directamente.
});
app.get('/html/:web',function(req, res){
  try{
    web=fs.readFileSync(__dirname+'/static_content/html/'+req.params.web,'utf8');
  }catch(e){
    mierda();
  }
  res.send(web);
});
app.get('/final',function(req, res){
  try{
    web=fs.readFileSync(__dirname+'/static_content/html/final.html','utf8');
  }catch(e){
    mierda();
  }
  res.send(web);
});
app.get('/image/:im',function(req, res){
  try{
    var laImagen = fs.readFileSync(__dirname+'/static_content/image/'+req.params.im);
  }catch(e){
    mierda();
  }
  res.send(laImagen);
});
app.get('/js/:page', function (req, res) { 
  try{
    var js = fs.readFileSync(__dirname+'/static_content/js/'+req.params.page);
  }catch(e){
    mierda();
  }
  res.contentType('text/javascript');
  res.send(js);
});
app.get('/css/:page', function (req, res) { 
  try{
    var js = fs.readFileSync(__dirname+'/static_content/css/'+req.params.page);
  }catch(e){
    mierda();
  }
  res.contentType('text/javascript');
  res.send(js);
});

app.post('/bdd/:nombre/:mail/:twitter/:estado/:nuevo',function(req, res){ //los campos del post son /bdd/"nombre"/"mail"/"twitter"/"estado"/"nuevo"
  estructura.nombre = req.params.nombre;
  estructura.id = Math.floor(Math.random()*100000);
  estructura.mail = req.params.mail;
  estructura.twitter = req.params.twitter;
  estructura.estado = req.params.estado;
  estructura.intervalo = 'intervalo';
  estructura.nuevo = req.params.nuevo;
  if(estructura.twitter != 'nada') {
    twitter.twitea('Muchas gracias @'+estructura.twitter+' por darte de alta en Js Grid y ceder unos cuantos ciclos de computación!! :)');
  }
    res.contentType('application/json');
    res.send( "{ error: 0, direccion: 'http://server-jsgrid.rhcloud.com/html/web_cliente.html' }\n" );
});

io.sockets.on('connection', function (socket) {
fabrizio.nuevo({"id":socket.id,"intervalo":["0","0"],"factor_pr":2,"factor_sec":0});//añade un nuevo cliente a la base de datos. Al coger el mismo ID que asigna socket.io, se garantiza que es unico para cada cliente.

  socket.emit('news',JSON.stringify({"WPAv":datos[0],"ANonce":datos[1],"SNonce":datos[2],"MIC":datos[3],"EAPOL":datos[4],"AP_MAC":datos[5],"ST_MAC":datos[6],"SSID":datos[7]}));

  socket.on('done', function (data) {
    socket.broadcast.emit('disconnect');
    socket.emit('disconnect');//El broadcast manda a todos menos al emisor. A este hay que mandarle una individual
    cierra(data);
  });

  socket.on('dame', function (data){
      var damedatos=JSON.parse(data);//Mejor NO usar 'eval'. "eval is evil". JSON.parse es su 'version' segura.
    fabrizio.damefactores(socket.id, function(ld){
	  var temp=genera_intervalo(socket.id,damedatos.tiempo,ld[0],ld[1]);
	  var fact_sec=temp.pop();
	  var fact_principal=temp.pop();
	  temp={"origen":temp[0], "final":temp[1], "valores":temp[2]};
	  //socket.emit('news',JSON.stringify({"WPAv":datos[0],"ANonce":datos[1],"SNonce":datos[2],"MIC":datos[3],"EAPOL":datos[4],"AP_MAC":datos[5],"ST_MAC":datos[6],"SSID":datos[7]}));
	  socket.emit('datos',JSON.stringify(temp));
	  fabrizio.actualiza(socket.id,temp.origen,temp.final,fact_principal,fact_sec);
      });
      //socket.emit('datos',genera_intervalo(socket.id,damedatos.tiempo));//Le pasa a la funcion el ID del cliente para que pueda buscarlo en la BBDD, y el tiempo que ha tardado en procesar.
  });

});

server.listen(PORT);

console.log("Servidor funcionando en => http://localhost:" + PORT);

function genera_intervalo(id,tiempo,factor_pr, factor_sec){
    var orig_ascii=[].concat(ascii)//"truco" para que las variables se copien por valor, y no por referencia.
    ,final_ascii=[].concat(ascii);
    
    if ((tiempo/(DURACION_QUERYS*1000))>1){
	factor_sec=0;
	factor_pr--;
	}
    else{
	factor_sec++;
	if (factor_sec == 8){
	    factor_pr++;
	    factor_sec=0;
	    }
	}
    //console.log("Factor: " + factor_pr + " " + factor_sec);

    for (var i=final_ascii.length-1; i>=final_ascii.length-factor_pr;i--){
	   final_ascii[i]=valores[valores.length-1];
	}
    var temp=[].concat(final_ascii);
    ascii=cambia_valores(temp,valores,temp.length-1);

    if (array_a_string(final_ascii) == max_valor){//Reseteo ascii metiendole un valor mas, y aumento tambien max_valor.
	for (var i=0;i<ascii.length;i++){
	ascii[i]=valores[0];
	   }
	ascii.push(valores[0]);
	max_valor+=valores[valores.length-1];
	}
    console.log("Procesando intervalo:");
    console.log(orig_ascii);
    console.log(final_ascii);
    n+=Math.pow(valores.length,factor_pr);//El numero de combinaciones es "total de posibles valores" elevado a "numero de variables"
    return [orig_ascii, final_ascii, valores, factor_pr, factor_sec];//JSON que se envia con 3 ARRAYS. Es mas comodo que tratarlos como strings, porque en este ultimo formato no se pueden cambiar caracteres individuales tan facilmente
}

function cambia_valores(cadena,val,pos){//funcion recursiva de fuerza bruta
	var i=val.indexOf(cadena[pos]);
	if (cadena[pos] != val[val.length-1]){
	   cadena[pos]=val[i+1];
	   return cadena;
	}
	else{
	   cadena[pos]=val[0];
	   return cambia_valores(cadena,val,pos-1);
	}
}

function array_a_string(array){
var cadena='';
for (var z=0; z<array.length; z++){
	      cadena+=array[z];
	   }
return cadena;
}

function muestra_cuenta(){
    if (n != 0) console.log("Procesando " + Math.round(n/DURACION_CLAVES_SEG) + " claves por segundo\n\n");
    n=0;
}

function mierda(){
    console.log("\n\nSe ha producido un error.\n\nLa sintaxis es 'node server.js --Aa1$ -L 8 <PATH_CAPTURA>.txt' -> 'A' si quieres procesar letras mayusculas, 'a' minusculas, '1' numeros, '%' simbolos. Con 'L' indicas el tamaño minimo desde el que empezar. La captura de trafico debe hacerse con airodump filtrando por BSSID, y convertirse a .txt mediante 'tcpdump -XX -r captura.cap > captura.txt'\n\n saliendo...\n\n");
    process.exit(1);
}

function cierra(pass){
    console.log("Password encontrada! -> "+pass+"\n\n");
    setTimeout(function(){
    fabrizio.borra_todo();//Borra todos los 'collections'
	process.exit(0);
    },6000);//Duerme 6 segundos para que les de tiempo a los clientes a pedir la web final
}
