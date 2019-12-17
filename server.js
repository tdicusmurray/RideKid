var fs = require('fs');
var privateKey = fs.readFileSync('/etc/letsencrypt/live/ridekid.com/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/ridekid.com/fullchain.pem', 'utf8');

var credentials = { key: privateKey, cert: certificate };
var https = require('https');

var httpsServer = https.createServer(credentials);
httpsServer.listen(1337);

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: httpsServer
});
var dbconfig = {user: 'postgres',host: 'localhost',database: 'ridekid',password: 'red832',port: 5432};

const { Client } = require('pg');
const new_ride_event = new Client(dbconfig);
new_ride_event.connect();
new_ride_event.query('LISTEN new_ride');

const new_driver_event = new Client(dbconfig);
new_driver_event.connect();
new_driver_event.query('LISTEN new_driver');

var PeerServer = require('peer').PeerServer;
 
var server = PeerServer({
  port: 7777,
  allow_discovery: true,
  ssl: {
    key: fs.readFileSync('/etc/letsencrypt/live/ridekid.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/ridekid.com/fullchain.pem')
  }
});
server.on('connection', (client) => {
}); 

const database = new Client(dbconfig);
database.connect();
const app = require('express')();

const bodyParser = require('body-parser');
app.post('/webhook', bodyParser.raw({type: 'application/json'}), (request, response) => {
  let event;
  try {
    event = JSON.parse(request.body);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
  switch (event.type) {
    case 'checkout.session.completed':
      const success = event.data.object;
      database.query("UPDATE ride SET paid = true WHERE id=($1);", [success.client_reference_id])
          .then( res => { response.json({received: true}); }, err => {console.error(err)});
      break;
    default:
      return response.status(400).end();
  }
  response.json({received: true});
});

app.listen(6969);
wss.on('connection', function connection(connection) {
    function send(tag, data) {
      data.push({type: tag});
      connection.send(JSON.stringify(data));
    }
    var person_id;
    new_ride_event.on('notification', function(msg) {
      try {
          connection.send(JSON.stringify(msg));
      } catch (e) {
          return console.error(e);
      }
    });
    new_driver_event.on('notification', function(msg) {
      try {
          send("update_ridekid", JSON.parse(msg));
        } catch (e) {
          return console.error(e);
        }
    });

    connection.on('message', function(message) {
      if (typeof message === 'string') {
        try {
          var messageObject = JSON.parse(message);
        } catch (e) {
          return console.error(e);
        }
      } else return;
      
      function send(tag, data) {
		    data.push({type: tag});
		    connection.send(JSON.stringify(data));
	   }
     function encrypt_password(password, user_salt, global_salt) {
         return sha256(password + user_salt + global_salt);
     }
     switch(messageObject.type) {
        case "login":
          database.query("SELECT user_salt FROM person WHERE email = ($1);", [messageObject.data[0]]).then( res => {
            database.query("SELECT password FROM person WHERE email = ($1) AND password = ($2);", [messageObject.data[0],messageObject.data[1]]).then( res => { send("login_result",res.rows) }, err => {console.error(err)}); 
          }, err => {console.error(err)});
        break;
	      case "new_ride":
          database.query("SELECT * FROM ride JOIN person ON (ride.person_id = person.id);")
          .then( res => { send("new_ride",res.rows); }, err => {console.error(err)});
        break;
        case 'create_ride':
          database.query("INSERT INTO ride (person_id,destination_lat,destination_lng) VALUES (($1),($2),($3)) RETURNING *;", [person_id, messageObject.data[0], messageObject.data[1]])
          .then( res => { ride_id = res.rows['id']; send("ride_sent", Array(ride_id));  }, err => {console.error(err)});
          break;
        case "new_driver":
          database.query("SELECT * FROM person WHERE driving = TRUE;")
          .then( res =>  {send("new_driver",res.rows); }, err => {console.error(err)});
        break;
        case "create_ridekid":
          database.query("INSERT INTO person (email,password,user_salt,lat,lng,driving) VALUES (($1),($2),($3),($4),($5), true) RETURNING *;", [messageObject.data[0], messageObject.data[1],messageObject.data[2],messageObject.data[3],messageObject.data[4]])
          .then( res => { person_id = res.rows['id']; }, err => {console.error(err)});
        break;
        case "update_ridekid":
	        database.query("UPDATE person SET lat = ($1), lng = ($2) WHERE id=($3);", [messageObject.data[0], messageObject.data[1], person_id])
	        .then( res => { }, err => {console.error(err)});
	      break;
     }
    });
    connection.on('close', function(connection) {});
});