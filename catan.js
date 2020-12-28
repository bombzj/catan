
let ctx, grid = 120, images = {}, cars, curTile, touchable = false, board=[], vSlots = [], eSlots = [], curMove, editMode = false, solving = false, curRotate = 0
let offsetX, offsetY
let touchX, touchY, tileStack, tiles
let players
let curPlayer
let curTile4Token
let lastTile	// token can place here only
let tokens

function init() {
	btnDelete.disabled = true
	// scores.initTileType()
	ctx = canvas.getContext("2d")
	let files = []
	for(let [index, item] of tileTypes.entries()) {
		files.push(index)
		item.id = index
	}
	for(let num = 2;num <=12;num++) {
		if(num != 7) {
			files.push('num' + num)
		}
	}
	for(let c of allColors) {
		files.push(c + city)
		files.push(c + road)
		files.push(c + settlement)
	}
	files.push('robber')
	loadImages(files, () => {
		drawAll()
	});

	
	offsetX = -grid * (boardWidth / 2 - 2)
	offsetY = -grid * (boardWidth / 2 - 3)

	canvas.addEventListener("mousedown", function (event) {
		if(!touchable) {
			touchstart(event.offsetX, event.offsetY)
		}
	}, false);
	canvas.addEventListener("mousemove", function (event) {
		if(!touchable) {
			touchmove(event.offsetX, event.offsetY)
		}
	}, false);
	window.addEventListener("mouseup", function (event) {
		if(!touchable) {
			touchend(event.offsetX, event.offsetY)
		}
	}, false);
	
	canvas.addEventListener("touchstart", function (event) {
		touchable = true
		event.preventDefault(); 
		var bcr = event.target.getBoundingClientRect();
		touchstart(event.touches[0].clientX - bcr.x, event.touches[0].clientY - bcr.y)
	}, false);
	canvas.addEventListener("touchmove", function (event) {
		event.preventDefault(); 
		var bcr = event.target.getBoundingClientRect();
		touchmove(event.touches[0].clientX - bcr.x, event.touches[0].clientY - bcr.y)
	}, false);
	window.addEventListener("touchend", function (event) {
		var bcr = event.target.getBoundingClientRect();
		touchend(event.changedTouches[0].clientX - bcr.x, event.changedTouches[0].clientY - bcr.y)
	}, false);

	loadAllGame()
	restart()
}

function restart(playerNumber = 2, clear = false) {
	let game = games[gameId]
	if(clear) {
		game = undefined
	}
	scores.initScore()
	lastTile = undefined

	if(game) {
		players = game.players.map(item => {
			return {
				id : item.id,
				color: allColors[item.id],
				road: 15,
				settlement: 5,
				city: 4,
				score: item.score
			}
		})
		tiles = []
		for(let item of game.tiles) {
			let tile = {
				x : item.x,
				y : item.y,
				type : tileTypes[item.type]
			}
			// scores.addTile(tile)
			tiles.push(tile)
		}

		tokens = []
		for(let item of game.tokens) {
			let tile = tiles[item.tile]
			if(!tile) {
				continue
			}
			let player = players[item.player]
			let group = tile.groups[item.index]
			let token = {
				tile : tile,
				index : item.index,
				player : player,
				type : item.type
			}
			tokens.push(token)
			if(!tile.tokens) {
				tile.tokens = []
			}
			tile.tokens[item.index] = item.player

			if(group) {
				group.tokens.push(token)
			}
			player.token--
		}
		tileStack = game.stack
		curPlayer = game.curPlayer
	} else {
		players = []
		for(let i = 0;i < playerNumber;i++) {
			players.push({
					id : i,
					color: allColors[i],
					road: 15,
					settlement: 5,
					city: 4,
					score: 0,
				},)
		}

		// scores.addTile(initTile)
		// scores.addTile(initTile2)
		curPlayer = 0

		tileStack = []
		tokens = []
		let start
		let tileIds = []
		for(let tile of tileTypes) {
			if(tile.start) {
				start = tile.id
			} else {
				for(let i = 0;i < tile.count;i++) {
					tileIds.push(tile.id)
				}
			}
		}
		shuffle(tileIds)

		let numberTags = [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12]
		shuffle(numberTags)

		board = []
		for(let i = 0;i < 10;i++) {
			board[i] = []
		}

		tileIds = [start].concat(tileIds)
		tiles = []
		for(let [index, item] of tileIds.entries()) {
			let tile = {
				x : tilePos[index][0],
				y : tilePos[index][1],
				type : tileTypes[item],
				vSlot: [],
				eSlot: [],
			}
			if(index > 0) {
				tile.number = numberTags[index - 1]
			}
			tiles.push(tile)
			board[tile.x][tile.y] = tile
		}


		for(let tile of tiles) {
			for(let i = 0;i < 6;i++) {
				if(!tile.vSlot[i]) {
					let slot = {
						tile: tile
					}
					vSlots.push(slot)
					tile.vSlot[i] = slot
					let match = vMatch[i]
					let matchTile1 = board[match[0] + tile.x][match[1] + tile.y]
					if(matchTile1) {
						matchTile1.vSlot[match[2]] = slot
					}
					let matchTile2 = board[match[3] + tile.x][match[4] + tile.y]
					if(matchTile2) {
						matchTile2.vSlot[match[5]] = slot
					}
				}
				if(!tile.eSlot[i]) {
					let slot = {
						tile: tile
					}
					eSlots.push(slot)
					tile.eSlot[i] = slot
					let match = eMatch[i]
					let matchTile = board[match[0] + tile.x][match[1] + tile.y]
					if(matchTile) {
						matchTile.eSlot[match[2]] = slot
					}
				}
			}
		}

		
		offsetX = 20 //-grid * (boardWidth / 2 - 2)
		offsetY = -200 //-grid * (boardWidth / 2 - 3)
	}


	tilesLeft.innerHTML = tileStack.length
	for(let i = 0;i < players.length;i++) {
		document.getElementById("score" + i).innerHTML = players[i].score
	}
	drawAll()

	checkFinish()
}

function checkFinish() {
	if(tileStack.length == 0) {
		scores.checkFinalToken()
	}
}

function shuffle(arr) {
	const len = arr.length
	if(len < 2) {
		return
	}
	for(let i = 0;i < len * 5;i++) {
		let a = Math.floor(Math.random() * len)
		let b = Math.floor(Math.random() * len)
		if(a == b) {
			i--
			continue
		}
		let s = arr[a]
		arr[a] = arr[b]
		arr[b] = s
	}
}

function next() {
	if(lastTile) {
		scores.checkToken()
		for(let i = 0;i < players.length;i++) {
			document.getElementById("score" + i).innerHTML = players[i].score
		}
		lastTile = undefined
		curPlayer = (curPlayer + 1) % players.length
		btnNext.disabled = true
		drawAll()
		saveGame()
	}
	checkFinish()
}

// toggle edit mode
function edit() {
	editMode = !editMode;
	if(editMode) {
		drawAll()
		btnDelete.disabled = false
	} else {
		drawAll()
		btnDelete.disabled = true
	}
}

// remove all cars
function empty() {
	cars = []
	drawAll()
	if(editMode) {
		drawBackup()
	}
}

function drawAll(c) {
	ctx.clearRect(0,0,canvas.width,canvas.height); 
	for(let tile of tiles) {
		draw(tile.type.id, grid * (tile.x) * square3 + offsetX, grid * (tile.y + tile.x / 2) + offsetY, grid / square3, grid)
		if(tile.number) {
			draw('num' + tile.number, grid * (tile.x) * square3 + offsetX, grid * (tile.y + tile.x / 2) + offsetY, 
					grid/3, grid/3)
		}
		// if(tile.tokens) {
		// 	let place = tile.type.place
		// 	for(let [index, token] of tile.tokens.entries()) {
		// 		let tokenPlace = rotate(place[index], tile.rotate)
		// 		if(players[token]) {
		// 			draw(players[token].color, 
		// 				grid * (tile.x + tokenPlace[0]) + offsetX - grid/6, 
		// 				grid * (tile.y + tokenPlace[1]) + offsetY - grid/6, 
		// 				grid/3, grid/3)
		// 		}
		// 	}
		// }
	}
	let tokens = [
		{
			type: city,
			x: 2,
			y: 2,
			place: 0,
		},
		{
			type: city,
			x: 2,
			y: 2,
			place: 1,
		},
		{
			type: city,
			x: 2,
			y: 2,
			place: 2,
		},
		{
			type: city,
			x: 2,
			y: 2,
			place: 3,
		},
		{
			type: city,
			x: 2,
			y: 2,
			place: 4,
		},
		{
			type: city,
			x: 2,
			y: 2,
			place: 5,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 0,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 0,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 1,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 2,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 3,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 4,
		},
		{
			type: road,
			x: 4,
			y: 4,
			place: 5,
		},
	]
	for(let token of tokens) {
		let placeOffset = token.type == road ? hexEdgeOffset[token.place] : hexVertexOffset[token.place]
		draw('red' + token.type, grid * ((token.x) * square3 + placeOffset[0]) + offsetX, grid * (token.y + token.x / 2 + placeOffset[1]) + offsetY, 
					grid/6, grid/6)
	}
	// drawBackup()
}

function rotate(arr, r) {
	if(r == 0) {
		return arr
	} else if(r == 1) {
		return [1 - arr[1], arr[0]]
	} else if(r == 2) {
		return [1 - arr[0], 1 - arr[1]]
	} else if(r == 3) {
		return [arr[1], 1 - arr[0]]
	}
}


const zoomTile = 2;
function drawTokenPlace(tile, ex, ey) {
	let x = grid * tile.x + offsetX
	let y = grid * tile.y + offsetY
	draw(tile.type.id, x, y, grid * zoomTile, grid * zoomTile)
	if(tile.type.place) {
		for(let place of tile.type.place) {
			let placeR = rotate(place, tile.rotate)
			let px = x + grid * placeR[0] * zoomTile
			let py = y + grid * placeR[1] * zoomTile
			if(Math.abs(ex - px) < grid / 3 &&
					Math.abs(ey - py) < grid / 3) {
				
			} else {
				ctx.globalAlpha = 0.5
			}
			draw(players[curPlayer].color, 
				px - grid / 3, 
				py - grid / 3,
				grid / 1.5, grid / 1.5)
			ctx.globalAlpha = 1
		}
	}
}

function placeToken(tile, ex, ey) {
	let player = players[curPlayer]
	if(!editMode && player.token == 0) {
		return
	}
	let x = grid * tile.x + offsetX
	let y = grid * tile.y + offsetY
	if(tile.type.place) {
		for(let [index, place] of tile.type.place.entries()) {
			let placeR = rotate(place, tile.rotate)
			let px = x + grid * placeR[0] * zoomTile
			let py = y + grid * placeR[1] * zoomTile
			if(Math.abs(ex - px) < grid / 3 &&
					Math.abs(ey - py) < grid / 3) {

				let group = tile.groups[index]
				if(group && group.tokens.length > 0) {
					return
				}
				
				if(!tile.tokens) {
					tile.tokens = [];
				}
				tile.tokens[index] = curPlayer
				let token = {tile : tile, index : index, player : player, type : place[2]}
				tokens.push(token)
				if(group) {
					group.tokens.push(token)
				}
				if(!editMode) {
					player.token--
					next()
				}
				return
			}
		}
	}
}

const backupStartX = 8
function drawBackup() {
	let startX = backupStartX
	let startY = 0
	let w = 0.5
	if(editMode) {
		for(let [index, tileType] of tileTypes.entries()) {
			draw(index, grid * startX, grid * startY, grid*w, grid*w)
			tileType.position = [startX, startY, w, w];	// TODO: should be one time job
			startY += w + 0.02
			if((index + 1) % 16 == 0) {
				startX += w + 0.02
				startY = 0
			}
		}
	} else {
		if(tileStack.length > 0) {
			if(!lastTile) {
				draw(tileStack[0], grid * startX, grid * startY, grid*0.8, grid*0.8)
			}
			let player = players[curPlayer]

			startX = backupStartX
			startY = 1.1
			ctx.globalAlpha = 0.5
			draw(player.color, grid * startX, grid * startY, grid/4, grid/4)
			ctx.globalAlpha = 1
			startX += 0.3
			for(let i = 0;i < player.token;i++) {
				draw(player.color, grid * startX, grid * startY, grid/4, grid/4)
				startX += 0.3
				if(i == 2) {
					startX = backupStartX
					startY += 0.3
				}
			}
		}
	}
}

const rotateDegree = [0, Math.PI/2, Math.PI, Math.PI*3/2]
function draw(file, x, y, w = grid, h = grid, rotate = 0) {
	if(rotate > 0) {
		ctx.save()
		ctx.translate(x+w/2, y+h/2)
		ctx.rotate(rotateDegree[rotate])
		ctx.translate(-x-w/2, -y-h/2)
	}
	ctx.drawImage(images[file], x - w/2, y-h/2, w, h)
	if(rotate > 0) {
		ctx.restore()
	}
}

let dragX = null, dragY
function touchstart(ex, ey) {
	if(1) return
	let x = ex / grid
	let y = ey / grid
	
	if(curTile4Token) {	// place token or cancel
		placeToken(curTile4Token, ex, ey)
		curTile4Token = undefined
		drawAll()
		return
	}

	if(editMode) {
		for(let [index, tileType] of tileTypes.entries()) {
			if(x >= tileType.position[0] && x < tileType.position[2] + tileType.position[0] &&
				y >= tileType.position[1] && y < tileType.position[3] + tileType.position[1]) {
				curTile = {x : -1, y : -1, type : tileTypes[index], rotate : curRotate}
				return
			}
		}
	} else if(tileStack.length > 0 && !lastTile){
		if(ex > backupStartX * grid && ey < grid) {
			curTile = {x : -1, y : -1, type : tileTypes[tileStack[0]], rotate : curRotate}
			return
		}
	}
	
	let ox = x - offsetX / grid
	let oy = y - offsetY / grid
	for(let tile of tiles) {
		if(ox >= tile.x && ox < tile.x + 1 &&
			oy >= tile.y && oy < tile.y + 1) {

			if(!editMode) {
				if(!lastTile || lastTile != tile) {
					break
				}
			} else {
				// tiles.pop()
				// drawAll()
				// break;
			}
			curTile4Token = tile
			drawTokenPlace(tile)
			return
		}
	}

	if(ex < 850 && ey < 850) {
		dragX = ex - offsetX
		dragY = ey - offsetY
	}
}

function touchmove(ex, ey) {
	if(1) return
	if(dragX != null) {
		offsetX = ex - dragX
		offsetY = ey - dragY
		drawAll()
		return
	}
	if(curTile4Token) {
		drawTokenPlace(curTile4Token, ex, ey)
	}
	let x = Math.floor((ex - offsetX) / grid)
	let y = Math.floor((ey - offsetY) / grid)
	if(true) {
		if(curTile) {
			if(x >= 0 && x <= boardWidth && y >= 0 && y <= boardWidth) {
				let board = scores.board
				let vacant = board[x][y] == undefined
				let connected = false
				let connect = curTile.type.connect
				let isRiver = curTile.type.isRiver	// river must connect to river
				if(vacant) {
					let tile = board[x-1][y];
					if(tile) {
						vacant = connect[1 + curTile.rotate & 3] == tile.type.connect[3 + tile.rotate & 3]
						if(vacant && (!isRiver || isRiver && connect[1 + curTile.rotate & 3] == river)) {
							connected = true;
						}
					}
				}
				if(vacant) {
					let tile = board[x+1][y];
					if(tile) {
						vacant = connect[3 + curTile.rotate & 3] == tile.type.connect[1 + tile.rotate & 3]
						if(vacant && (!isRiver || isRiver && connect[3 + curTile.rotate & 3] == river)) {
							connected = true;
						}
					}
				}
				if(vacant) {
					let tile = board[x][y-1];
					if(tile) {
						vacant = connect[0 + curTile.rotate & 3] == tile.type.connect[2 + tile.rotate & 3]
						if(vacant && (!isRiver || isRiver && connect[ + curTile.rotate & 3] == river)) {
							connected = true;
						}
					}
				}
				if(vacant) {
					let tile = board[x][y+1];
					if(tile) {
						vacant = connect[2 + curTile.rotate & 3] == tile.type.connect[0 + tile.rotate & 3]
						if(vacant && (!isRiver || isRiver && connect[2 + curTile.rotate & 3] == river)) {
							connected = true;
						}
					}
				}
				if(vacant && connected) {
					curTile.x = x
					curTile.y = y
				} else {
					curTile.x = -1
				}
			} else {
				curTile.x = -1
			}
			if(curTile.x == -1) {
				ctx.clearRect(0,0,canvas.width,canvas.height); 
				drawAll()
				draw(curTile.type.id, ex-grid/4, ey-grid/4, grid/2, grid/2, curRotate)
			} else {
				drawAll();
				draw(curTile.type.id, grid * curTile.x+offsetX, grid * curTile.y+offsetY, grid, grid, curRotate)
				drawBackup()
			}
		}
	}
}

function touchend(ex, ey) {
	if(1) return
	if(tileStack.length > 0 && !lastTile && !editMode){
		if(ex > 8 * grid && ey < grid) {
			rotateBackup()
		}
	}
	if(curTile) {
		if(curTile.x != -1) {
			tiles.push(curTile)
			scores.addTile(curTile)
			if(!editMode) {
				tileStack.shift()
				tilesLeft.innerHTML = tileStack.length
				lastTile = curTile
				if(players[curPlayer].token == 0) {
					next()
				} else {
					btnNext.disabled = false
				}
			} else {
				saveGame()
			}
		}
		curTile = undefined
		drawAll()
	}
	dragX = null
}

function rotateBackup() {
	curRotate = (curRotate + 1) & 3
	drawAll()
}

let gameId = -1
let games = []
function saveGame() {
	try {
		let game = {
			id : gameId,
			players : players.map(item => {
				return {
					id : item.id,
					score : item.score
				}
			}),
			tiles : tiles.map(item => {
				return {
					x : item.x,
					y : item.y,
					type : item.type.id,
					rotate : item.rotate
				}
			}),
			tokens : tokens.map(item => {
				return {
					tile : item.tile.id,
					index : item.index,
					player : item.player.id,
					type : item.type
				}
			}),
			stack : tileStack,
			curPlayer : curPlayer
		}
		localStorage.setItem("catan"+gameId, JSON.stringify(game));
		games[gameId] = game
	} catch(e) { console.log(e) }
}

function loadAllGame() {
	gameId = -1
	try {
		let jsonString
		while(jsonString = localStorage.getItem("catan"+(gameId + 1))) {
			gameId++
			games[gameId] = JSON.parse(jsonString)
		}
	} catch(e) { console.log(e) }
	gameId = localStorage.getItem("catanId");
	if(gameId == undefined) {
		gameId = 0
	} else {
		gameId = parseInt(gameId)
	}
}


function loadImages(sources, callback){
	var count = 0,
			imgNum = 0
	for(let src of sources){
			imgNum++
	}
	for(let src of sources){
			images[src] = new Image(src);
			images[src].onload = images[src].onerror = function(){
					if(++count >= imgNum){
							callback(images)
					}
			};

			images[src].src = 'res/' + src + '.png'
	}
}

function switchGame(delta) {
	gameId += delta
	if(gameId < 0) {
		gameId = 0
	}
	restart()
	localStorage.setItem("catanId", gameId);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

