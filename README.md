# RideKid
Rideshare platform code, Taxi and Lift example app.

First you must have a working cloud server running with Ubuntu 18.04

It is recommended that you use DigitalOcean.com but as long as you have a private key and can connect through an ssh protocol tool like putty or
winscp you can get started.



Run sudo apt-get install nodejs

Run sudo npm install foreverjs -g

navigate to /var/www/ or create this directory, or an appropriate named http root for your directory setup.


Upload all code from this github repostiory into the root folder, you *PROBABLY* want to put the server.js file in a level right above where the webserver
is serving the home page and content files.

Open server.js file on your local machine, /etc/letsencrypt/live/ridekid.com/ replace all directories to reflect your paths for your SSL certificate
the demo is creating using the LetsEncryt free ssl service.

var dbconfig = {user: 'postgres',host: 'localhost',database: 'ridekid',password: 'red832',port: 5432};

Replace the database information to connect to your credentials.


Run sudo npm install peerjs-server -g

This will give your server access to the video calling functionality. Bam. Wapow!

Now run 

sudo foreverjs start server.js --watchDirectory


This will run your server forever, and if any files change in the client or the server, Teddy's amazing framework will reload all the connected clients
so they always have the latest code there, and its good for development because now you dont have to refresh every time.

You're welcome!


If you need any new features from the original developer, TeddyMurray.com, make a feature request

CURREENT FEATURE REQUESTS:
Emergency Panic Button - $100
New payment gateway - $50

