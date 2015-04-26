var request;
function signup() {
  request = new XMLHttpRequest();
  var nombre=document.getElementById('nombre_signup').value;
  var mail=document.getElementById('mail_signup').value;
  var twitter=document.getElementById('twitter_signup').value;
  if(twitter == '') twitter = 'nada';
  if(nombre == '' || mail == '') {
    alert('No puedes dejar ni el campo "Nombre de usuario" ni el de "Correo electrónico" vacío!');
  }
  else {
    var peticion_str = '/bdd/'+nombre+'/'+mail+'/'+twitter+'/activo/si'; //los campos del post son /bdd/"nombre"/"mail"/"twitter"/"estado"/"nuevo"
    request.open('POST', peticion_str , true);
    request.onreadystatechange= redirige ;
    request.send(null);
  }
}

function login() {
  request = new XMLHttpRequest();
  var nombre=document.getElementById('nombre_login').value;
  var mail=document.getElementById('mail_login').value;
  if(nombre == '' || mail == '') {
    alert('No puedes dejar ni el campo "Nombre de usuario" ni el de "Correo electrónico" vacío!');
  }
  else {
    var peticion_str = '/bdd/'+nombre+'/'+mail+'/nada/activo/si'; //los campos del post son /bdd/"nombre"/"mail"/"twitter"/"estado"/"nuevo"
    request.open('POST', peticion_str , true);
    request.onreadystatechange= redirige ;
    request.send(null);
  }
}

function redirige() {
  if ( request.readyState == 4 ) {
    if ( request.status == 200 ) {
      var json;
      console.log(request.responseText);
      eval ( 'json = '+ request.responseText );
      console.log(json);
      if(json.error == 0) {
        window.location = json.direccion;
      }
      else {
        alert("Se ha producido un error, revisa que todos los campos estén correctos.");
      }
      json.resultado
    }
  }
}