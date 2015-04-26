fs = require('fs');

//La funcion es sensible a la estructura del archivo. Se presupone una concreta, pero si cambia no se leerá correctamente.
function leerCaptura(fichero,cb){
	var ANonce="";
	var SNonce="";
	var MIC="";
	var EAPOLf="";
	var WPAvers; //Version de WPA (WPA1-WPA2)
	var AP_MAC=""; //MAC del punto de acceso
	var ST_MAC=""; //MAC de la estacion
	var SSID="";
	fs.readFile(fichero, 'utf8',
		function(err,datos) {
			if (err) {
				return console.log(err);
			}
			//Separamos las filas
			var filas = datos.split("\n");
			var i=0;
			for (i=0;i<filas.length-1;i++) {
				//Busqueda de los mensajes EAPOL
				var n=filas[i].indexOf("EAPOL");
				//Posicion de referencia para la lectura de datos de interes
				var offset= 10;
				var str="";
				//Se controla que se haya encontrado la cadena EAPOL. Si no se ha escrito la cadena Anonce, es el primer mensaje
				//EAPOL, si ya se ha escrito ANonce pero SNonce 2, se trata del segundo mensaje. El resto no interesa.
				if(n!=-1 && ANonce.length==0){
					//En el primer mensaje se puede verificar si se trata de WPA1 o WPA2 y se obtienen las MACS
					//A continuacion se guardan todos los mensajes buscados: ANonce, SNonce, MIC y EAPOL
					if(filas[i].indexOf("v1")!=-1){
						WPAvers=1;					
					}
					else{
						WPAvers=2;
					}
					ST_MAC=(filas[i+1].substr(offset+10,14)).replace(/\s+/g, '');
					AP_MAC=(filas[i+1].substr(offset+25,14)).replace(/\s+/g, '');		
					ANonce=(filas[i+4].substr(offset+7,32)+filas[i+5].substr(offset,39)+filas[i+6].substr(offset,7)).replace(/\s+/g, '');
					//console.log("AP_MAC: "+AP_MAC);
					//console.log("ST_MAC: "+ST_MAC);
					//console.log("WPA version: "+WPAvers);
					//console.log("ANonce: "+ANonce);
				} else if(n!=-1 && SNonce.length==0 && ANonce.length!=0){
					SNonce=(filas[i+4].substr(offset+7,32)+filas[i+5].substr(offset,39)+filas[i+6].substr(offset,7)).replace(/\s+/g, '');
					MIC=(filas[i+8].substr(offset+7,32)+filas[i+9].substr(offset,7)).replace(/\s+/g, '');
					EAPOLf=(filas[i+3].substr(offset+5,34)+filas[i+4].substr(offset,39)+filas[i+5].substr(offset,39)+filas[i+6].substr(offset,39)+filas[i+7].substr(offset,39)+filas[i+8].substr(offset,39)+filas[i+9].substr(offset,39)+filas[i+10].substr(offset,27)).replace(/\s+/g, '');
					//Se sustituye el MIC (que esta incluido en el frame EAPOL ya que posteriormente el algoritmo para obtener la clave de acceso lo requeriere.
					EAPOLf=EAPOLf.replace(MIC,"00000000000000000000000000000000");
					//console.log("SNonce: "+SNonce);
					//console.log("MIC: "+MIC);
					//console.log("EAPOLf2: "+EAPOLf);
				}
				
				//Por ultimo, obtenemos el SSID. Se presupone que en la captura no hay paquetes de otras redes (filtrado previo por SSID, por ejemplo)
				var m=filas[i].indexOf("Assoc Request");
				
				if(m!=-1 && SSID.length == 0 ){
					SSID = filas[i].substr(filas[i].indexOf("(")+1,filas[i].indexOf(")")-filas[i].indexOf("(")-1)
					//console.log("SSID: "+SSID);
				}
			}
			//Se controla que se hayan leido los dos primeros paquetes EAPOL (con verificar si se tiene ANonce y SNonce es suficiente) y el Assoc Request
			if(ANonce.length !=0 && SNonce.length != 0 && SSID.length != 0){
				//console.log("Exito!");
			}
			else console.log("Error en la lectura del archivo");
		    return cb([WPAvers, ANonce, SNonce, MIC, EAPOLf, AP_MAC, ST_MAC, SSID]);
			})
}
exports.leerCaptura = leerCaptura;
