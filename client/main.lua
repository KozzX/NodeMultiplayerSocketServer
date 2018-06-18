local crypto = require("crypto")
local socket = require("socket")
local json   = require("json")
local Botao = require( "Botao" )

--local client = socket.connect("18.231.112.69",  1902)
local client = socket.connect("localhost",  1902)

local myId = ""
local myRoom = nil
local player
local life
local ping 

math.randomseed( os.time(  ) )


local function listener( event )
	local input,output = socket.select({ client },nil, 0)
	for i,v in ipairs(input) do
		local js = v:receive()
		print( "JS",js )
		if (js ~= nil) then
			local msg = json.decode(js) 
			if (msg.action == "connect") then
				myId = msg.id
			end
			if (msg.action == "MATCHMAKE") then
			
			end
			if (msg.action == "gameinit") then
				myRoom = msg.room	
        		player = display.newRect( display.contentCenterX, display.contentHeight, display.contentWidth, display.contentHeight * 50 / 100 )
        		--player:setFillColor( math.random( 0,255 )/255, math.random( 0,255 )/255,math.random( 0,255 )/255)
        		player:setFillColor( 0,0,0 )
        		player.anchorY = 1
        		life = display.newText( "50", display.contentCenterX, display.contentHeight * 10 /100, native.systemFont, 50)
				ping = display.newText( "0", display.contentWidth * 15 / 100, display.contentHeight * 10 /100, native.systemFont, 20)		
			end
			if (msg.action == "HIT") then
				life.text = msg.life
				transition.to( player, {height=display.contentHeight * msg.life / 100,time=100} )
			end
			if (msg.action == "PING") then
				if (myId == msg.id) then
					ping.text = string.format( "%6.2f", system.getTimer() - msg.timestamp )
					print("Ping", system.getTimer() - msg.timestamp)
					msg.action = 'PING-INFO'
					msg.ping = system.getTimer() - msg.timestamp
					client:send(json.encode(msg))

				end
			end
		end
	end
end
	
Runtime:addEventListener( "enterFrame", listener )


--local btnReady = Botao.newPlayButton("Ready",display.contentHeight / 25 * 5)

local function sendHit(  )
	local msg = {}
	msg.id = myId
	msg.action = "HIT"
	msg.hit = math.random( 1,5 )
	msg.room = myRoom
	msg.timestamp = system.getTimer()
	--print(msg.timestamp)
	if (myRoom ~= nil) then
		client:send(json.encode(msg))
	end
end

local function ping(  )
	local msg = {}
	msg.id = myId
	msg.action = "PING"
	msg.room = myRoom
	msg.timestamp = system.getTimer()
	if (myRoom ~= nil) then
		client:send(json.encode(msg))		
	end
end




--btnReady:addEventListener( "tap", function (  )
	--btnReady:removeSelf( )
	local msg = {}
	msg.id = myId
	msg.action = "MATCHMAKE"
	client:send(json.encode(msg))
	timer.performWithDelay( 50, function (  )
		--Runtime:addEventListener("tap",sendHit)		
		
		sendHit()
	end , -1 )
--end )
timer.performWithDelay( 1000, ping, -1 )


