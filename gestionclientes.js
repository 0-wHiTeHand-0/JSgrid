//gestionclientes.js

//para ver la base de dato en mongo teclar:
//mongo
//use mongoapp
//db.clientes.find()
var db = require('mongojs').connect('localhost/mongoapp', ['clientes']);//url de la base de datos y collections (los llamo 'clientes')
/*var gestion = function(myJSON,vector_intervalo, callback) {

var intervalo_final="";
        //objecto cliente
        function cliente(nombre, id, direccion, estado, intervalo, nuevo){
        //      this.nombre = nombre;
                this.id = id;
          //    this.direccion = direccion;
          //    this.estado = estado;
                this.intervalo = intervalo;
        //      this.nuevo = nuevo; //el array de los clientes nuevos solo lo tiene el main
        }

        var cliente1 = new cliente(myJSON.nombre, myJSON.id, myJSON.direccion, myJSON.estado, myJSON.intervalo, myJSON.nuevo);

       
if (cliente1.nuevo == "si"){
        //si es "nuevo" seguro quiere trabajo y estarà en activo
        cliente1.nuevo = "no";
        intervalo_final = calcula_intervalo(vector_intervalo);
        cliente1.intervalo = intervalo_final;
        //save nos permite insertar un nuevo cliente
        db.clientes.save(cliente1, function(err, guardaCliente){
        if (err || !guardaCliente) {
                console.log("Cliente "+cliente1.nombre+" no guardado en la base de dato. Error: "+err);
                if (callback) callback();      
        }      
        else {
                console.log("Cliente "+guardaCliente.nombre+" guardado");
                //intervalo_final = calcula_intervalo(vector_intervalo);
                if (callback) callback(intervalo_final); //es como return intervalo_final
                }//del else
        });//del save

}else{
        //ESTA PARTE SE PUEDE BORRAR PORQUE UN CLIENTE QUE VUELVE ACTIVO TIENE OTRO IDENTIFICADOR Y SE GUARDARA EN LA BASE DE DATOS
        if (cliente1.estado == "activo"){
                intervalo_final = calcula_intervalo(vector_intervalo);
                //actualizo base de dato, el cliente vuelve activo y habrà un otro intervalo
                db.clientes.update({nombre: cliente1.nombre}, {$set: {estado: "activo", intervalo: intervalo_final}}, function(err) {
                        if (err) {
                        console.log("error en la actualizacion del cliente: "+cliente1.nombre);
                        if (callback) callback();                      
                        }
                        else {
                        console.log("actualizacion completada del cliente que vuelve activo: "+cliente1.nombre);
                        if (callback) callback(intervalo_final);
                        }
                });//del update
        }
        else
        if (cliente1.estado == "desconectado"){
               
                //mira el viejointervalo en la base de dato para el cliente con este nombre            
                var cursor = db.clientes.find({nombre:cliente1.nombre},function(err){
                        if (err) {
                                console.log(err);
                                if (callback) callback(intervalo_final);                        
                        }
                        else
                        {
                                console.log("cliente encontrado: "+cliente1.nombre);
                                //el cursor tiene todos los documentos encontrados, pero en nuestro caso solo serìa uno
                                cursor.on('data', function(doc) {
                                         intervalo_final = doc.intervalo;
                                         if (callback) callback(intervalo_final); //devuelvo su intervalo
                                });
                        }
                });

                //lo borro desde la base de datos porque si volverà activo tendrà un identificador diferente por el socket.io
                db.clientes.remove({nombre: cliente1.nombre}, function(err) {
                        if (err){
                        console.log("error en el borrar el cliente desconectado: "+cliente1.nombre);
                        }
                        else {
                        console.log("actualizacion completada de la base de datos para el cliente: "+cliente1.nombre);
                        }                      
                });    
               
        }
        else if (cliente1.estado == "sintrabajo"){
                //le doy trabajo y lo dejo volver activo!
                intervalo_final = calcula_intervalo(vector_intervalo);
                db.clientes.update({nombre: cliente1.nombre}, {$set: {estado: "activo", intervalo: intervalo_final}}, function(err) {
                                if (err) {
                                console.log("error en la actualizacion del intervalo del cliente sin trabajo: "+cliente1.nombre);
                                if (callback) callback();
                                }
                                else {
                                console.log("actualizacion intervalo cliente sintrabajo completada, cliente: "+cliente1.nombre);
                                if (callback) callback(intervalo_final);
                        }                              
                });//del update
        }//del else sintrabajo  
       
}//del else

//return intervalo_final; no se pone porque ya tengo la callback
}*/

function nuevo(myJSON){
db.clientes.save(myJSON, function(err, guardaCliente){
        if (err || !guardaCliente) {
                console.log("Cliente "+myJSON.id+" no guardado en la base de dato. Error: "+err);
                //if (callback) callback();    
        }      
        else {
                console.log("Cliente "+guardaCliente.id+" guardado");
                //intervalo_final = calcula_intervalo(vector_intervalo);
                //if (callback) callback(intervalo_final); //es como return intervalo_final
                }//del else
        });//del save
}

function borra_todo(){
db.clientes.remove();
db.close();
}

function damefactores(id,cb){
db.clientes.findOne({"id":id},function(error,doc){
   if (error) return cb(error);
   return cb([doc.factor_pr, doc.factor_sec]);
   });
}

function actualiza(id,origen,finale,f_pr,f_se){
db.clientes.update({"id":id},{$set:{"intervalo":[origen, finale],"factor_pr":f_pr,"factor_sec":f_se}},function(error){
   if (error) console.log("Error al actualizar: "+error);
   });
}

//logica del calculo del intervalo libre: el primero intervalo de dimension SIZE o menor que se encuentra en el vector de los intervalos lo asigno al cliente
function calcula_intervalo(vector_intervalo){
        var maximo = vector_intervalo.length;
        var size = 4; //a caso da definire
        var fin = 0;
        var hasta = 0;
        var index;
        for (var i=0; i<maximo; i++){
                if (vector_intervalo[i]==0){
                        hasta = size + i;
                        index = i;
                        break;
                }      
        }
        if (hasta > maximo){ //vee si vamos fuera del intervalo
                hasta = maximo;
        }
        for (var j=index; j<hasta;j++){
                                if (vector_intervalo[j]==1){ //està ya asignado
                                        fin = j - 1;
                                        break;                          
                                }else{
                                        fin = hasta;                            
                                }
        }
        intervalo = [i,fin];    

        return intervalo; //en json
}

var actualiza_vector = function(myJSON,vector_intervalo) {
        var desde = myJSON[0];
        var hasta = myJSON[1];
        //cobro el intervalo
        for (var i=desde; i<=hasta; i++){
                vector_intervalo[i]=1;  
        }
        return vector_intervalo;        
}

//esa sirve solo para los desconectados, asì que actualizo el vector de manera que se puede volver a calcular el hash sobre el intervalo donde no ha trabajado lo que se ha vuelto desconectado
var actualiza_vector2 = function(myJSON,vector_intervalo) {
        var desde = myJSON[0];
        var hasta = myJSON[1];
        //cobro el intervalo
        for (var i=desde; i<=hasta; i++){
                vector_intervalo[i]=0;  
        }
        return vector_intervalo;        
}

//exports.actualiza_vector = actualiza_vector;
//exports.actualiza_vector2 = actualiza_vector2;
//exports.gestion = gestion;
exports.nuevo = nuevo;
exports.damefactores = damefactores;
exports.actualiza = actualiza;
exports.borra_todo = borra_todo;

