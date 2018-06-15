var server = require('net').createServer()
var users = {}
var qtdSalas = 0;
var qtdJog = 0;
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

var cfg = {
  port: 1902,
  verbose: false // set to true to capture lots of debug info
}
var _log = function () {
  if (cfg.verbose) console.log.apply(console, arguments)
}

server.on('connection', function(user){
	user.setNoDelay(true);
	//user.setKeepAlive(true, 300 * 1000)
	user.isConnected = true;
	user.connectionId = "id" + user.remoteAddress  + '-' + user.remotePort;
	user.write('{"action":"connect","id":"'+user.connectionId+'"}\n')

	_log("----------User " + user.connectionId + " connected-----------");

	user.on('data', function (dataRaw){
		var pos = dataRaw.toString().indexOf("}");
		_log("RAW",dataRaw.toString().slice(0,pos+1));
		var message = JSON.parse(dataRaw.toString().slice(0,pos+1));
		if (message.action == 'MATCHMAKE') {
			_log("MATCHMAKE");
			user.room = "lobby";
			users[user.room] = users[user.room] || {};
			users[user.room][user.connectionId] = user;
			var lobbyUsers = Object.keys(users[user.room])
			if (lobbyUsers.length >= 2) {
				user.room = "game" + lobbyUsers[0] + lobbyUsers[1];
				users[user.room] = users[user.room] || {};
				users[user.room][lobbyUsers[0]] = users["lobby"][lobbyUsers[0]];
				users[user.room][lobbyUsers[1]] = users["lobby"][lobbyUsers[1]];

				delete users["lobby"][lobbyUsers[0]];
				delete users["lobby"][lobbyUsers[1]];

				users[user.room][lobbyUsers[0]].life = 50;
				users[user.room][lobbyUsers[1]].life = 50;
				users[user.room][lobbyUsers[0]].room = user.room;
				users[user.room][lobbyUsers[1]].room = user.room;
				users[user.room][lobbyUsers[0]].write('{"action":"gameinit","id":"' + lobbyUsers[0] + '","room":"' + user.room + '"}\n');
				users[user.room][lobbyUsers[1]].write('{"action":"gameinit","id":"' + lobbyUsers[1] + '","room":"' + user.room + '"}\n');

				_log("Criar Sala",users);				
			};
		};
		if (message.action == 'PING') {
			users[message.room][message.id].write(JSON.stringify(message) + "\n");
		};
		if (message.action == 'HIT') {
			_log("HIT");
			var hit = message.hit;
			var gameUsers = Object.keys(users[message.room])
			for (var i = 0; i < gameUsers.length; i++) {
				if (user.connectionId == gameUsers[i]) {
					users[message.room][gameUsers[i]].life = users[message.room][gameUsers[i]].life + hit;
				}else{
					users[message.room][gameUsers[i]].life = users[message.room][gameUsers[i]].life - hit;
				}

				message['life'] = users[message.room][gameUsers[i]].life;

				_log("LIFES",message.id, message.life);

				users[message.room][gameUsers[i]].write(JSON.stringify(message) + "\n");
			};
		};
	})//end of user.on('data')
	user.on('error', function () { return _destroySocket(user) })
	user.on('close', function () { return _destroySocket(user) })
})

var _destroySocket = function (user) {
  if (!user.room || !users[user.room] || !users[user.room][user.connectionId]) return
  users[user.room][user.connectionId].isConnected = false
  users[user.room][user.connectionId].destroy()
  delete users[user.room][user.connectionId]
  console.log(user.connectionId + ' has been disconnected from channel ' + user.room)

  if (Object.keys(users[user.room]).length === 0) {
    delete users[user.room]
    console.log('empty channel wasted ' + user.room)
  }
}

server.on('listening', function() {
	console.log("------------------------------------------------------------------");
	console.log("------------------------------------------------------------------");
	console.log("-------------------Socket Multiplayer Server ON-------------------");
	console.log("-------------------Port: " + server.address().port + "-------------------------------------");
	console.log("------------------------------------------------------------------");
	console.log("------------------------------------------------------------------");
	console.log("--------------------#...#...###...####...#####--------------------");
	console.log("--------------------##..#..#...#..#...#..#....--------------------");
	console.log("--------------------#.#.#..#...#..#...#..###..--------------------");
	console.log("--------------------#..##..#...#..#...#..#....--------------------");
	console.log("--------------------#...#...###...####...#####------0.0.1---------");
	console.log("------------------------------------------------------------------");
	console.log("------------------------------------------------------------------");
})
server.listen(1902, '::')


function monitRooms() {
	console.log("------------------------------------------------------------------");
	console.log("-----------------------Lista de users-----------------------------");
	console.log("----" + new Date().toString() + "----");
	console.log("------------------------------------------------------------------");

	var salas = (Object.keys(users));
	var qtdUsers = 0
	
	for (var i = 0; i < salas.length; i++) {
		console.log("Sala:",salas[i]);
		var usuarios = Object.keys(users[salas[i]]);
		for (var j = 0; j < usuarios.length; j++) {
			console.log("|_ Usuário:",usuarios[j],users[salas[i]][usuarios[j]].life);
			qtdUsers = qtdUsers + 1;
		};
		console.log("----------------------------");
	};
	console.log("Qtd Salas:", salas.length, "Qtd Jogadores",qtdUsers);
	qtdSalas = salas.length;
	qtdJog = qtdUsers;
	console.log("------------------------------------------------------------------");
	console.log("------------------------------------------------------------------");
	setTimeout(monitRooms, 2000);
	
}

setTimeout(monitRooms, 1000);
