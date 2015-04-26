
//el modulo de gestion de los clientes recibe la variable JSON llamada myJSONClient asì estructurada:

exports.myJSONClient = {
	"nombre" : "<nombre_cliente>", 
	"id" : "<id_cliente>", 
	"mail" : "<mail_cliente>",
	"twitter" : "<twitter_cliente>",
	"estado" : "<estad_cliente>", 
	"intervalo" : "<intervalo_cliente>",
	"nuevo" : "si" //o no
	};


/*

[...] gestion de los clientes, que se guardan en una base de dato MongoDB. Para cada cliente recibido se cambia su estado y le si asigna un intervalo.

*/

//este modulo enviarà al main con un return el intervalo que ha calculado. Aquì solo para ver si funciona la estructura JSON imprimo dicho intervalo:

