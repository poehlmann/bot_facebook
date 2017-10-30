var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

const APP_TOKEN = 'EAAVLmsiyCl0BACT4pDZCzD30GvZBQ6HATNFocb4MRAhDeYk54vMBJaaW21eppdKX5RZAjkuReHfy0LgAxG5v3MxRwi8CyktLsBWiIpcOQbZBFM31C2ByTixOSWpBOqn48xw7akiGfcx6Sw3MPgwY3lN0tkHMZCnuqxDUdOZCGozQZDZD';

var app = express();
app.use(bodyParser.json());
// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(3000, function(){
	console.log('servidor puerto 3000');	
});

app.get('/',function(req,res){
	res.send('bienvenido al taller');

});

//para validar los servidores
app.get('/webhook',function(req,res){
	console.log(req.query['hub.verify_token']);
	if(req.query['hub.verify_token']==='bpm'){
		res.send(req.query['hub.challenge']);
	}else{
		res.send('tu no puedes entrar aqui');	
	}

});

//para validar los eventos

/*
{ object: 'page',
  entry:
   [ { id: '294558634010404',
       time: 1509135557986,
       messaging: [Object] } ] }

 */
app.post('/webhook',function(req,res){
	var data=req.body;
	if(data.object === 'page'){
		data.entry.forEach(function(pageEntry){
				pageEntry.messaging.forEach(function(messagingEvent){
				//si es de tipo mensaje
				if(messagingEvent.message) {
                    receiveMessage(messagingEvent);
                }
			});
		});
		//respondemos con un ok, se recibio el mensaje
		res.sendStatus(200);
	}
});

//leer el mensaje

/*
{ sender: { id: '1900052246690986' },
  recipient: { id: '294558634010404' },
  timestamp: 1509135888009,
  message:
   { mid: 'mid.$cAAEL5gJA0ANlkMd2iVfX4It3iVg0',
     seq: 92317,
     text: 'bola' } }

 */
function receiveMessage(event){
	var senderID=event.sender.id;
	var messageText = event.message.text;
    evaluateMessage(senderID,messageText)
}

function evaluateMessage(recipientId,message){
	var finalMessage = '';
	if(isContain(message,'ayuda')){
		finalMessage = 'por el momento no te puedo ayudar';
	}else if(isContain(message,'gato')){
        sendMessageImage(recipientId);
	}else if(isContain(message,'clima')){
		getWeather(function(temperature){
			message = 'la temperatura es '+ temperature;
			sendMessageText(recipientId,message);
		});
	}else if(isContain(message,'info')){
		console.log('1');
		sendMessageTemplate(recipientId);
	}
	else{
		finalMessage = 'solo se repetir las cosas:' + message;
	}
	sendMessageText(recipientId,finalMessage);
}

function sendMessageTemplate(recipientId){
    var messageData = {
        recipient :{
            id: recipientId
        },
        message: {
            attachment: {
                type:'template',
                payload:{
                    template_type:"generic",
                    elements:[elemenTemplate()]
                }
            }
        }
    };
    console.log('2');
    callSendAPI(messageData);
}

function elemenTemplate(){
	return{
		title:'Bruno Poehlmann',
		subtitle:'desarrollo de un bot',
		item_url:'https:www.google.com',
		image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/220px-Cat_November_2010-1a.jpg',
		buttons:[buttonTemplate()]
	}
}

function buttonTemplate(){
	return{
		type:'web_url',
		url:'https:www.google.com',
		title:'CF'
	}
}

function getMessageWeather(temperature){
	if(temperature > 30){
		return "nos encontramos a "+temperature+ " hay demasiada calor";
	}else{
		return "nos encontramos a "+temperature+" es un bonito dia para salir";
	}
}

function sendMessageText(recipientId,message){
	var messageData = {
		recipient :{
			id: recipientId
		},
		message: {
			text: message
		}
	};
	callSendAPI(messageData);
}

function sendMessageImage(recipientId){
	//API ingur , buscamos por categoria, busqueda ramdon
    var messageData = {
        recipient :{
            id: recipientId
        },
        message: {
            attachment: {
            	type:'image',
				payload:{
            		url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/220px-Cat_November_2010-1a.jpg'
				}
			}
        }
    };
    callSendAPI(messageData);
}

function callSendAPI(messageData){
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: APP_TOKEN},
		method: 'POST',
		json : messageData
	}, function(error,response,data){
		if(error){
			console.log('no es posible enviar el mensaje');
		}else{
			console.log('el mensaje fue enviado');
		}
	})
}

function isContain(sentence, word){
	return sentence.indexOf(word)> -1;
}

function getWeather(callback){
	request('http://api.geonames.org/findNearByWeatherJSON?lat=-17.7916513&lng=-63.1957175&username=eduardo_gpg',
	function(error,response,data){
		if(!error){
			var response = JSON.parse(data);
			var temperature = response.weatherObservation.temperature;
			callback(temperature);
		}
	});
}