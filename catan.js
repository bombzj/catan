
let ctx, grid = 100, images = {}, cars, curTile, touchable = false, board=[], vSlots = [], eSlots = [], curMove, editMode = false, solving = false, curRotate = 0
let offsetX = 40, offsetY = -160
let touchX, touchY, devStack, tiles
let players
let curPlayer
let curTile4Token
let lastTile	// token can place here only
let tokens
let curToken = []
let stage
let robberToken = {}


function init() {
	btnDelete.disabled = true
	// scores.initTileType()
	ctx = canvas.getContext("2d")
	let files = []
	for(let [index, item] of tileTypes.entries()) {
		files.push(index)
		item.id = index
	}
	for(let [index, item] of devTypes.entries()) {
		files.push('dev' + index)
		item.id = index
	}
	for(let num = 2;num <=12;num++) {
		if(num != 7) {
			files.push('num' + num)
		}
	}
	for(let num = 0;num < 6;num++) {
		files.push('sea' + num)
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

	
	// offsetX = -grid * (boardWidth / 2 - 2)
	// offsetY = -grid * (boardWidth / 2 - 3)

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

	// document.styleSheets[0].insertRule('.cssPlayer {background-color: ' + cssColor[curPlayer] + '}', 0);
	// cssRulePlayer = document.styleSheets[0].rules[0]
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
	labelDice.innerHTML = '?'

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
					res: [0, 0, 0, 0, 0, 0],
					develop: [],
					develop2: [],	// got in current turn, cannot use
					exchange: []	// 3:1 and then 2:1 for each resource
				},)
		}

		// scores.addTile(initTile)
		// scores.addTile(initTile2)

		tileStack = []
		
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

		devStack = []
		for(let dev of devTypes) {
			for(let i = 0;i < dev.count;i++) {
				devStack.push(dev)
			}
		}
		shuffle(devStack)

		board = []
		tokens = []
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

		// initial all slots of tiles
		for(let tile of tiles) {
			tile.posX = tile.x * square3
			tile.posY = tile.y + tile.x / 2
			for(let i = 0;i < 6;i++) {
				if(!tile.vSlot[i]) {
					let placeOffset = hexVertexOffset[i]
					let slot = {
						tile: tile,
						x: tile.x * square3 + placeOffset[0],
						y: tile.y + tile.x / 2 + placeOffset[1]
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
					let placeOffset = hexEdgeOffset[i]
					let slot = {
						tile: tile,
						rotate: i / 6,
						x: tile.x * square3 + placeOffset[0],
						y: tile.y + tile.x / 2 + placeOffset[1]
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

		// for harbor exchange rate
		for(let harbor of harbors) {
			board[harbor[0]][harbor[1]].vSlot[harbor[2]].exchange = harbor[3]
		}

		robberToken.tile = tiles[0]

		stage = stageInit
		if(true) {
			stage = stagePlay
			curPlayer = 0
			// addToken(players[0], board[3][2].vSlot[2], settlement)
			players[0].res = [0, 10, 10, 10, 10, 10];
			players[1].res = [0, 10, 10, 10, 10, 10];
		}
		btnNext.disabled = false
		next()
	}


	drawRes()
	drawAll()

	// checkFinish()
}

function addToken(player, slot, type) {
	if(type == road) {
		let token = {
			type: type,
			player: player,
			slot: slot
		}
		slot.token = token
		tokens.push(token)
		player.road--
	} else if(type == city || type == settlement) {
		let token = {
			type: type,
			player: player,
			slot: slot
		}
		if(slot.token) {
			tokens = tokens.filter(item => {
				return item != slot.token
			})
		}
		slot.token = token
		player.score += 1
		tokens.push(token)
		if(type == city) {
			player.settlement++
			player.city--
		} else {
			if(slot.exchange >= 0) {
				player.exchange[slot.exchange] = true
				updateExchangeRate()
			}
			player.settlement--
		}
	} else if(type == robber) {
		robberToken.tile = slot
	}
	curToken.shift()
}

function buyToken(type) {
	if(curToken[0]) {
		return false
	}
	let player = players[curPlayer]
	if(type == road && player.road <= 0) {
		return false
	}
	if(type == city && player.city <= 0) {
		return false
	}
	if(type == settlement && player.settlement <= 0) {
		return false
	}
	if(type == develop && devStack.length == 0) {
		return false
	}
	let cost = tokenCost[type]
	for(let i = 1;i < 6;i++) {
		if(player.res[i] < cost[i]) {
			return false
		}
	}
	for(let i = 1;i < 6;i++) {
		player.res[i] -= cost[i]
	}
	if(type == develop) {
		let dev = devStack.pop()
		player.develop2.push(dev)
	} else {
		curToken.push( {
			player: player,
			type: type
		})
		btnNext.disabled = true
		btnCancelBuy.disabled = false
	}
	drawRes()
	drawAll()
}
function buyRoad() {
	buyToken(road)
}
function buySettlement() {
	buyToken(settlement)
}
function buyCity() {
	buyToken(city)
}
function buyDev() {
	buyToken(develop)
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

function cancelBuy() {
	let token = curToken[0]
	if(token && stage == stagePlay) {
		if(token.type == road || token.type == city || token.type == settlement) {
			let player = players[curPlayer]
			let cost = tokenCost[token.type]
			for(let i = 1;i < 6;i++) {
				player.res[i] += cost[i]
			}
			curToken.shift()
			btnCancelBuy.disabled = true
			btnConfirmBuy.disabled = true
			btnNext .disabled = false
			drawRes()
			drawAll()
		}
	}
}

function confirmBuy() {
	let token = curToken[0]
	if(token) {
		if(token.slot) {
			addToken(token.player, token.slot, token.type)
			btnConfirmBuy.disabled = true
			btnCancelBuy.disabled = true
			if(curToken[0]) {
				drawRes()
				drawAll()
			} else {
				btnNext.disabled = false
				if(stage == stageSettle1 || stage == stageSettle2) {
					next()
				} else {
					drawRes()
					drawAll()
				}
			}
		} else if(token.type == robber && token.tile) {
			let player = players[curPlayer]
			let from = players[1 - curPlayer]	// TODO steal from adjacent settlement or city
			let res = getRandomResource(from.res)
			if(res) {
				player.res[res]++
				from.res[res]--
				addLog(player.color + ' stole a ' + resourceNames[res] + ' from ' + from.color)
			}

			addToken(player, token.tile, token.type)
			drawRes()
			drawAll()
			btnNext.disabled = false
			btnConfirmBuy.disabled = true
			btnCancelBuy.disabled = true
		}
	}
}

function getRandomResource(resArr) {
	let arr = []
	for(let [index, num] of resArr.entries()) {
		for(let i = 0;i < num;i++) {
			arr.push(index)
		}
	}
	if(arr.length == 0) {
		return 0
	}
	return arr[Math.floor(Math.random() * arr.length)]
}

// rob card, drop card, move robber
function rob() {
	curToken.push({
		type: robber
	})
}
// rob if resource more than 7
function rob2() {

}

function useDevelop(i) {
	let player = players[curPlayer]
	let dev = player.develop[i]
	switch(dev.type) {
		case soldier: {
			rob()
			break;
		}
		case yearOfPlenty: {
			curToken.push({
				type: yearOfPlenty
			})
			curToken.push({
				type: yearOfPlenty
			})
			break;
		}
		case roadBuilding: {
			addRoadBuildingTokens()
			break;
		}
		case monopoly: {
			curToken.push({
				type: monopoly
			})
			break;
		}
		case victoryPoint: {
			player.score++
			break;
		}
		default: {

		}
	}
	player.develop.splice(i, 1)
}

// when action needs to choose a resource
function clickResource(res) {
	let player = players[curPlayer]
	let token = curToken[0]
	if(token) {
		if(token.type == yearOfPlenty) {
			player.res[res]++
			curToken.shift()
			addLog(player.color + ' produced 1 ' + resourceNames[res])
			drawRes()
			drawAll()
		} else if(token.type == monopoly) {
			let sum = 0
			for(let [index, p] of players.entries()) {
				if(curPlayer != index) {
					sum += p.res[res]
					p.res[res] = 0
				}
			}
			player.res[res] += sum
			addLog(player.color + ' got ' + sum + ' ' + resourceNames[res] + ' by monopoly')
			curToken.shift()
			drawRes()
			drawAll()
		}
	}
}

// exchange resource
function exchange() {
	let from = exFrom.selectedIndex + 1
	let to = exTo.selectedIndex + 1
	let player = players[curPlayer]
	let rate = getExchangeRate(from)
	if(player.res[from] >= rate) {
		player.res[from] -= rate
		player.res[to]++
	}
	drawRes()
}
function getExchangeRate(from) {
	let player = players[curPlayer]
	if(player.exchange[exFrom.selectedIndex + 1]) {
		return 2
	}
	if(player.exchange[0]) {
		return 3
	}
	return 4
}
function updateExchangeRate() {
	let rate = getExchangeRate(exFrom.selectedIndex + 1)
	exchangeRate.innerHTML = rate + ':1'
}

// for game initial setup
let initTokenType = [settlement, road]
function addInitialTokens() {
	for(let type of initTokenType) {
		curToken.push({
			player: players[curPlayer],
			type: type
		})
	}
}
// for development card of road building
let roadBuildingTokenType = [road, road]
function addRoadBuildingTokens() {
	for(let type of roadBuildingTokenType) {
		curToken.push({
			player: players[curPlayer],
			type: type
		})
	}
}

function next() {
	if(curToken[0]) {
		return
	}
	if(stage == stageInit) {
		stage = stageSettle1
		phase = 0
		curPlayer = 0
		addHighlight()
		addInitialTokens()
	} else if(stage == stageSettle1) {
		removeHighlight()
		curPlayer++
		if(curPlayer >= players.length) {
			stage = stageSettle2
			// initial resource for each player
			for(let tile of tiles) {
				for(let slot of tile.vSlot) {
					if(slot.token) {
						let token = slot.token
						token.player.res[tile.type.resource] += 1
					}
				}
			}
			curPlayer = players.length - 1
		}
		addHighlight()
		addInitialTokens()
	} else if(stage == stageSettle2) {
		removeHighlight()
		curPlayer--
		if(curPlayer < 0) {
			stage = stagePlay
			curPlayer = 0
		} else {
			addInitialTokens()
		}
		addHighlight()
	} else {
		addLog('---------------------')
		removeHighlight()
		curPlayer++
		if(curPlayer >= players.length) {
			curPlayer = 0
		}
		let player = players[curPlayer]
		if(player.develop2.length > 0) {
			player.develop = player.develop.concat(player.develop2)
			player.develop2 = []
		}

		addHighlight()
		let dice1 = Math.floor(Math.random() * 6) + 1
		let dice2 = Math.floor(Math.random() * 6) + 1
		let dice = dice1 + dice2
		addLog('the dice roll is ' + dice)
		labelDice.innerHTML = dice1 + "+" + dice2
		if(dice == 7) {
			rob2()
			rob()
		} else {
			for(let player of players) {
				player.resAdd = [0, 0, 0, 0, 0, 0]
				player.resAddAll = 0
			}
			for(let tile of tiles) {
				if(tile.number == dice && robberToken.tile != tile) {
					for(let slot of tile.vSlot) {
						if(slot.token) {
							let token = slot.token
							if(token.type == city) {
								token.player.res[tile.type.resource] += 2
								token.player.resAdd[tile.type.resource] += 2
								token.player.resAddAll += 2
							} else {
								token.player.res[tile.type.resource] += 1
								token.player.resAdd[tile.type.resource] += 1
								token.player.resAddAll += 1
							}
						}
					}
				}
			}
			for(let player of players) {
				let resStr = ''
				for(let [index, sum] of player.resAdd.entries()) {
					if(sum > 0) {
						if(resStr.length > 0) {
							resStr += ', '
						}
						resStr += sum + ' ' + resourceNames[index]
					}
				}
				if(player.resAddAll > 0) {
					addLog(player.color + ' produced ' + resStr)
				}
			}
		}
		updateExchangeRate()
	}
	if(curToken[0]) {
		btnNext.disabled = true
	}
	drawRes()
	drawAll()
	// if(lastTile) {
	// 	scores.checkToken()
	// 	for(let i = 0;i < players.length;i++) {
	// 		document.getElementById("score" + i).innerHTML = players[i].score
	// 	}
	// 	lastTile = undefined
	// 	curPlayer = (curPlayer + 1) % players.length
	// 	btnNext.disabled = true
	// 	drawAll()
	// 	saveGame()
	// }
	// checkFinish()
}

function addLog(log) {
	labelHistory.innerHTML += log + "\r\n"
	labelHistory.scrollTop = labelHistory.scrollHeight
}

const cssColor = [
	'#6666ff', '#ff4444', '#55ff55', '#ffff66', '#444444', '#66ff99'
]

// let cssRulePlayer
function addHighlight() {
	// cssRulePlayer.style.backgroundColor = cssColor[curPlayer]
	// tableRes.rows[curPlayer + 1].className = "highlight"
	let player = players[curPlayer]
	btnRoad.src = 'res/' + player.color + '1.png'
	btnSettlement.src = 'res/' + player.color + '2.png'
	btnCity.src = 'res/' + player.color + '3.png'

}
function removeHighlight() {
	// tableRes.rows[curPlayer + 1].className = ""
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

function drawRes() {
	let player = players[curPlayer]
	for(let res = 1;res < 6;res++) {
		tableRes.rows[1].cells[res - 1].innerHTML = player.res[res]
	}
	tableRes.rows[1].cells[5].innerHTML = player.score
	if(player.score >= 10) {
		addLog(player.color + ' has won the game')
	}
	labelRoad.innerHTML = player.road
	labelSettlement.innerHTML = player.settlement
	labelCity.innerHTML = player.city

	labelDev.innerHTML = devStack.length
}

const tokenInitPos = {
	x: 570,
	y: 30,
	interval: 30,
}
const devDrawPos = {
	x: 5.2,
	y: 7.6,
	interval: 0.65,
	width: 1 / 1.5,
	height: 1
}
function drawAll(c) {
	ctx.clearRect(0,0,canvas.width,canvas.height); 
	for(let i = 0;i < 6;i++) {
		draw('sea' + i, grid * seaPos[i][0] + offsetX, grid * seaPos[i][1] + offsetY, grid * 3.2, grid, seaPos[i][2])
	}
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
	
	for(let token of tokens) {
		drawToken(token)
	}
	// draw current token to use
	let tokenInitPosX = tokenInitPos.x
	for(let [index, token] of curToken.entries()) {
		if(token.slot) {
			drawToken(token)
		}
		if(token.type == robber && token.tile) {
			draw('robber', grid * token.tile.posX + offsetX, grid * token.tile.posY + offsetY, grid/4, grid/2)
		}
		
		if(token.type == road) {
			draw(token.player.color + token.type, tokenInitPosX, tokenInitPos.y, grid/4, grid/10)
		} else if(token.type == city || token.type == settlement) {
			draw(token.player.color + token.type, tokenInitPosX, tokenInitPos.y, grid/4, grid/4)
		} else if(token.type == robber) {
			draw('robber', tokenInitPosX, tokenInitPos.y, grid/4, grid/2)
		} else if(token.type == yearOfPlenty) {
			draw('dev1', tokenInitPosX, tokenInitPos.y, grid/3, grid/2)
		} else if(token.type == monopoly) {
			draw('dev3', tokenInitPosX, tokenInitPos.y, grid/3, grid/2)
		}
		tokenInitPosX -= tokenInitPos.interval
	}
	if(robberToken) {
		let tile = robberToken.tile
		draw('robber', grid * tile.posX + offsetX, grid * tile.posY + offsetY, grid/4, grid/2)
	}
	let devX = devDrawPos.x
	let player = players[curPlayer]
	for(let dev of player.develop) {
		draw('dev' + dev.id, grid * devX + offsetX, grid * devDrawPos.y + offsetY, devDrawPos.width * grid, devDrawPos.height * grid)
		devX -= devDrawPos.interval
	}
	if(player.develop2.length > 0) {
		ctx.globalAlpha = 0.5
		for(let dev of player.develop2) {
			draw('dev' + dev.id, grid * devX + offsetX, grid * devDrawPos.y + offsetY, devDrawPos.width * grid, devDrawPos.height * grid)
			devX -= devDrawPos.interval
		}
		ctx.globalAlpha = 1
	}
	// drawBackup()
}

function drawToken(token) {
	if(token.type == road) {
		draw(token.player.color + token.type, grid * token.slot.x + offsetX, grid * token.slot.y + offsetY, grid/4, grid/10, token.slot.rotate)
	} else {
		draw(token.player.color + token.type, grid * token.slot.x + offsetX, grid * token.slot.y + offsetY, grid/6, grid/6)
	}
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

function draw(file, x, y, w = grid, h = grid, rotate = 0) {
	if(rotate > 0) {
		ctx.save()
		ctx.translate(x, y)
		ctx.rotate(Math.PI*2*rotate)
		ctx.translate(-x, -y)
	}
	ctx.drawImage(images[file], x - w/2, y-h/2, w, h)
	if(rotate > 0) {
		ctx.restore()
	}
}

let dragX = null, dragY
function touchstart(ex, ey) {
	let token = curToken[0]
	if(token) {
		if(token.type == road) {
			for(let slot of eSlots) {
				let dx = (ex - offsetX) / grid - slot.x
				let dy = (ey - offsetY) / grid - slot.y
				if(dx * dx + dy * dy < 0.04 && !slot.token) {
					token.slot = slot
					btnConfirmBuy.disabled = false
					break
				}
			}
		} else if(token.type == settlement || token.type == city) {
			for(let slot of vSlots) {
				let dx = (ex - offsetX) / grid - slot.x
				let dy = (ey - offsetY) / grid - slot.y
				if(dx * dx + dy * dy < 0.04 && (!slot.token && token.type == settlement || slot.token && slot.token.type == settlement && token.type == city)) {
					token.slot = slot
					btnConfirmBuy.disabled = false
					break
				}
			}
		} else if(token.type == robber) {
			for(let tile of tiles) {
				let dx = (ex - offsetX) / grid - tile.posX
				let dy = (ey - offsetY) / grid - tile.posY
				if(dx * dx + dy * dy < 0.1 && tile != robberToken.tile) {
					token.tile = tile
					btnConfirmBuy.disabled = false
					break	
				}
			}
		}
		drawAll()
	} else {
		let dx = (ex - offsetX) / grid - devDrawPos.x + devDrawPos.width/2
		let dy = (ey - offsetY) / grid - devDrawPos.y + devDrawPos.height/2
		if(dy > 0 && dy < devDrawPos.height) {
			let i = -Math.floor(dx / devDrawPos.interval)
			if(i < players[curPlayer].develop.length) {
				useDevelop(i)
				drawRes()
				drawAll()
			}
		}
	}
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

