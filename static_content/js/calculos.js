var socket = io.connect();
var datos_mic = '';

socket.on('news', function (data) {
	datos_mic = JSON.parse(data);//se guarda el MIC a crackear.
});

socket.on('disconnect', function(){
    var temp=document.URL;
    temp=temp.substring(0,temp.indexOf('/'));
    document.location.href=temp+"/final";
});

socket.on('datos',function(data){
	var temp=JSON.parse(data);
	generar_claves(temp.origen,temp.final,temp.valores);//RECIBE ARRAYS
});

function generar_claves(intervaloInicial,intervaloFinal,valores){
    var temporal=intervaloInicial;
    var temp_final=array_a_string(intervaloFinal);
    var resultado='';
    var d = new Date();//Para calcular el tiempo que le lleva procesar el intervalo (milisegundos)
    var tiempo=d.getTime(); 

    while (resultado != temp_final){
	resultado=array_a_string(temporal);
        temporal=cambia_valores(temporal,valores, temporal.length-1);
        calcular(resultado);
    }
    d = new Date();
    tiempo=d.getTime()-tiempo;
    socket.emit('dame',JSON.stringify({"tiempo":tiempo}));
}

function array_a_string(array){
var cadena='';
for (var z=0; z<array.length; z++){
	      cadena+=array[z];
	   }
return cadena;
}
//Funcion para generar los valores de las contraseñas . Consiste en una
//funcion recursiva de fueza bruta
function cambia_valores(cadena,val,pos){
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

function oeee(){
  socket.emit('dame', JSON.stringify({"tiempo":0}));
}

function calcular(pass){
	var PMK=fcalc(pass,datos_mic.SSID);
	var B = ordenar_valores(datos_mic.AP_MAC,datos_mic.ST_MAC,datos_mic.ANonce,datos_mic.SNonce);
	var PTK=calcularPTK(PMK,B);
	var MIC=calcular_MIC(PTK,CryptoJS.enc.Hex.parse(datos_mic.EAPOL),datos_mic.WPAv);
	console.log("PASS: "+pass);
	console.log("PMK: "+PMK);
	console.log("ANonce: "+datos_mic.ANonce);
	console.log("SNonce: "+datos_mic.SNonce);
	console.log("AP_MAC: "+datos_mic.AP_MAC);
	console.log("AT_MAC: "+datos_mic.ST_MAC);
	console.log("EAPOLf: "+datos_mic.EAPOL);
	console.log("MIC_datos: "+datos_mic.MIC);
	console.log("MIC_calc: "+MIC);
	if (MIC == datos_mic.MIC) socket.emit('done',pass);
}

//Funcion para concatenar los valores de los mac y los nonce  B= Min(AA,SPA) || Max(AA,SPA) || Min(ANonce,SNonce) || Max(ANonce,SNonce))
//para ser usado por la funcion PRF-X
function ordenar_valores(a_m, c_m, a_n, s_n){
	var temp="";
        if (parseInt(c_m,16) > parseInt(a_m,16)) temp=a_m.concat(c_m);
        else temp=c_m.concat(a_m);
        if (parseInt(a_n,16) > parseInt(s_n,16)) temp=temp.concat(s_n,a_n);
        else temp=temp.concat(a_n,s_n);
        return temp;
}

//Calculo de la PTK segun el esquema de la funcion PRF-n(PMK, 'Pairwise key expansion', Min(AA,SPA) || Max(AA,SPA) || Min(ANonce,SNonce) || Max(ANonce,SNonce))
//Esta funcion se basa en la concatenacion de la funcion criptografica HmacSHA1, implementada en el script auxiliar CrypstoJS.

function calcularPTK(PMK,B){
        var variable_PTK =  "";
		for (var i=0; i<5; i++){
			//La funcion HmacSHA1 tiene como argumentos el mensaje a cifrar y la clave = CryptoJS.HmacSHA1("Message", "Secret Passphrase");
			//Es necesario hacer las siguiente conversiones de formato de caracteres, pues el mensaje a cifrar esta compuesto de distintas partes
			//cada una con una codificacion diferente, mientras que la funcion auxiliar solo acepta array de palabras (segun la documentacion de crytoJS)

			var mensaje  = CryptoJS.enc.Utf8.parse("Pairwise key expansion\x00")+B+CryptoJS.enc.Utf8.parse(String.fromCharCode(i));
			//var mensaje  = CryptoJS.enc.Utf8.parse("Pairwise key expansion\x00")+B+CryptoJS.enc.Utf8.parse(String.fromCharCode(i));
			variable_PTK += CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(mensaje),CryptoJS.enc.Hex.parse(PMK));
		}
		console.log("PTK: "+variable_PTK);
		return variable_PTK;
}

//Funcion para el calculo del MIC, segun lo especificado en el estandard IEEE 802.11i (funcion HMAC-MD5 para WPA1)
//La clave será la KCK (EAPOL-Key Confirmation Key), que son los primeros 16 bytes (32 caracteres hexadecimales) de la PTK calculada anteriormente.
//Los datos serán el frame EAPOL (msg 2/4) sustituyendo el campo del MIC por ceros

function calcular_MIC(PTK, EAPOLf,WPAv){
	WPA_VERSION=WPAv;
	KCK=CryptoJS.enc.Hex.parse(PTK.substr(0,32));
	//Dependiendo de la version de WPA, se obtiene el MIC mediante la funcion MC5 (WPA1) o SHA1 (WPA2)
	var mic="";
	if (WPA_VERSION == 1) mic = CryptoJS.HmacMD5(EAPOLf, KCK);
	else{
		 var mic=CryptoJS.HmacSHA1(EAPOLf, KCK);
		 //En este caso el resultado de la funcion es mas largo que el MIC, que solo tiene 16 bytes
		 mic=mic.toString().substr(0,32);
	 }
	return mic;
}
