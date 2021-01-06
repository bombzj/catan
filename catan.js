
let ctx, grid = 110, images = {}, cars, curTile, touchable = false, board=[], vSlots, eSlots, curMove, editMode = false, solving = false, curRotate = 0
let offsetX = 15, offsetY = -190
let touchX, touchY, devStack, tiles
let players
let curPlayer
let curTile4Token
let lastTile	// token can place here only
let tokens
let curToken
let stage
let robberToken = {}
let robPlayers = [], saveCurPlayer

let maxArmyPlayer, maxRoadPlayer


function init() {
	btnDelete.disabled = true

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
			// touchmove(event.offsetX, event.offsetY)
		}
	}, false);
	window.addEventListener("mouseup", function (event) {
		if(!touchable) {
			// touchend(event.offsetX, event.offsetY)
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
		// var bcr = event.target.getBoundingClientRect();
		// touchmove(event.touches[0].clientX - bcr.x, event.touches[0].clientY - bcr.y)
	}, false);
	window.addEventListener("touchend", function (event) {
		// var bcr = event.target.getBoundingClientRect();
		// touchend(event.changedTouches[0].clientX - bcr.x, event.changedTouches[0].clientY - bcr.y)
	}, false);

	document.styleSheets[0].insertRule('.cssPlayerTd {}', 0);
	cssRulePlayer = document.styleSheets[0].rules[0]
	loadAllGame()
	restart()
}

function restart(playerNumber = 2, clear = false, test = false) {
	let game = games[gameId]
	if(clear) {
		game = undefined
	}

	labelDice.innerHTML = '?'
	
	curToken = []
	maxArmyPlayer = undefined
	maxRoadPlayer = undefined

	if(game) {
		players = game.players.map(item => {
			return {
				id : item.id,
				color: allColors[item.id],
				road: item.road,
				settlement: item.settlement,
				city: item.city,
				allSoldier: item.allSoldier,
				allRoad: item.allRoad,
				score: item.score,
				res: item.res,
				develop: item.develop,
				develop2: [],
				exchange: []
			}
		})
		tiles = []
		for(let item of game.tiles) {
			let tile = {
				x : item.x,
				y : item.y,
				type : tileTypes[item.type],
				number: item.number,
			}

			tiles.push(tile)
		}
		initTileData()

		tokens = []
		for(let item of game.tokens) {
			let tile = tiles[item.tile]
			if(!tile) {
				continue
			}
			let player = players[item.player]
			let slot
			if(item.type == road) {
				slot = tile.eSlot[item.index]
			} else {
				slot = tile.vSlot[item.index]
			}
			let token = {
				type : item.type,
				tile : tile,
				player : player,
				slot : slot
			}
			slot.token = token
			if(slot.exchange >= 0) {
				token.player.exchange[slot.exchange] = true
			}
			tokens.push(token)
		}
		devStack = game.devStack
		robberToken = {
			tile: tiles[game.robberTile]
		}
		curPlayer = game.curPlayer
		stage = game.stage
		for(let player of players) {
			checkMaxArmy(player, false)
		}
		calcAllRoads()
		labelHistory.innerHTML = game.log
		labelHistory.scrollTop = labelHistory.scrollHeight
	} else {
		players = []
		for(let i = 0;i < playerNumber;i++) {
			players.push({
					id : i,
					color: allColors[i],
					road: 15,	// road token left
					settlement: 5,	// settlement token left
					city: 4,		// city token left
					allSoldier: 0,
					allRoad: 0,		// max length of road
					score: 0,
					res: [0, 0, 0, 0, 0, 0],
					develop: [],
					develop2: [],	// got in current turn, cannot use
					exchange: []	// 3:1 and then 2:1 for each resource
				},)
		}

		
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
				devStack.push(dev.id)
			}
		}
		shuffle(devStack)

		tokens = []

		tileIds = [start].concat(tileIds)
		tiles = []
		for(let [index, item] of tileIds.entries()) {
			let tile = {
				x : tilePos[index][0],
				y : tilePos[index][1],
				type : tileTypes[item],
			}
			if(index > 0) {
				tile.number = numberTags[index - 1]
			}
			tiles.push(tile)
		}

		initTileData()

		robberToken.tile = tiles[0]

		stage = stageInit
		if(test) {
			stage = stagePlay
			curPlayer = 0
			addToken(players[0], board[3][2].vSlot[2], settlement)
			addToken(players[1], board[4][3].vSlot[2], settlement)
			players[0].res = [0, 10, 10, 10, 10, 10];
			players[1].res = [0, 10, 10, 10, 10, 10];
		}
		btnNext.disabled = false
		labelHistory.innerHTML = ''
	}
	if(players.length >= 3) {
		tableScore.rows[3].style.display=""
	} else {
		tableScore.rows[3].style.display="none"
	}
	if(players.length >= 4) {
		tableScore.rows[4].style.display=""
	} else {
		tableScore.rows[4].style.display="none"
	}
	next(false)
	updatePlayerDisplay()
	drawRes()
	drawAll()

	// checkFinish()
}

// initialize tile slots and connections
function initTileData() {
	board = []
	vSlots = []
	eSlots = []
	for(let i = 0;i < 10;i++) {
		board[i] = []
	}
	for(let [index, tile] of tiles.entries()) {
		tile.id = index
		tile.vSlot = []
		tile.eSlot = []
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
					index: i,
					x: tile.x * square3 + placeOffset[0],
					y: tile.y + tile.x / 2 + placeOffset[1],
					vConnect: new Set(),
					eConnect: new Set(),
				}
				vSlots.push(slot)
				tile.vSlot[i] = slot
				let match = vConnects[i]
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
					index: i,
					rotate: i / 6,
					x: tile.x * square3 + placeOffset[0],
					y: tile.y + tile.x / 2 + placeOffset[1],
					vConnect: new Set(),
					eConnect: new Set(),
				}
				eSlots.push(slot)
				tile.eSlot[i] = slot
				let match = eConnects[i]
				let matchTile = board[match[0] + tile.x][match[1] + tile.y]
				if(matchTile) {
					matchTile.eSlot[match[2]] = slot
				}
			}
		}
		// connect slot 2 slot
		for(let i = 0;i < 6;i++) {
			tile.vSlot[i].vConnect.add(tile.vSlot[(i + 1) % 6])
			tile.vSlot[i].vConnect.add(tile.vSlot[(i + 5) % 6])
			tile.vSlot[i].eConnect.add(tile.eSlot[(i) % 6])
			tile.vSlot[i].eConnect.add(tile.eSlot[(i + 5) % 6])

			// tile.eSlot[i].eConnect.add(tile.eSlot[(i + 1) % 6])
			// tile.eSlot[i].eConnect.add(tile.eSlot[(i + 5) % 6])
			tile.eSlot[i].vConnect.add(tile.vSlot[(i) % 6])
			tile.eSlot[i].vConnect.add(tile.vSlot[(i + 1) % 6])
		}
	}

	// for harbor exchange rate
	for(let harbor of harbors) {
		board[harbor[0]][harbor[1]].vSlot[harbor[2]].exchange = harbor[3]
	}
}

// get the length of longest road of the player
function getRoadLength(player) {
	let roadSlots = new Set()
	for(let token of tokens) {
		if(token.type == road && token.player == player) {
			roadSlots.add(token.slot)
		}
	}
	let limitTimes = roadSlots.size
	let segments = []
	for(let i = 0;i < limitTimes;i++) {	// limit times to prevent dead cycle
		if(roadSlots.size == 0) {
			break
		}
		let seg = {
			edge: [],
			vertex: []
		}
		segments.push(seg)
		let slot = roadSlots.values().next().value
		roadSlots.delete(slot)
		seg.edge.push(slot)
		for(let vc of slot.vConnect) {
			let curV = vc
			let curE = slot
			for(let i = 0;i < 15;i++) {		// prevent dead cycle
				if(curV.token && curV.token.player != player) {
					break
				} else {
					let next, intersect = false
					for(let ec of curV.eConnect) {
						if(ec != curE && ec.token && ec.token.player == player) {
							if(next) {
								intersect = true	// break if intersection
								break
							} else {
								next = ec	// go ahead if line
							}
						}
					}
					if(next == slot || !next) {	// end of this path, next == slot means circle
						break
					} else if(intersect) {	// end of this path with intersection
						seg.vertex.push(curV)
						break
					} else {	// path go on
						curV = getNext(next.vConnect, curV)
						curE = next
						roadSlots.delete(next)
						seg.edge.push(next)
					}
				}
			}
		}

	}
	return calcMaxRoad(segments, player)
}

// get the other from set
function getNext(slots, from) {
	for(let slot of slots) {
		if(slot != from) {
			return slot
		}
	}
	debugger		// not found???
}

let maxRoadResult
// calculate longest path in graph
function calcMaxRoad(segments, player) {
	// initialize for calc
	let vmap = new Map()	// vertex map, connect all segments by vertex
	for(let seg of segments) {
		for(let v of seg.vertex) {
			let v2 = vmap.get(v)
			if(v2) {
				v2.segments.push(seg)
			} else {
				vmap.set(v, {
					segments: [seg]
				})
			}
		}
	}
	for(let seg of segments) {
		seg.count = seg.edge.length
		seg.vertex2 = seg.vertex.map(item => vmap.get(item))
	}
	maxRoadResult = 0
	// try every segment as beginning
	for(let seg of segments) {
		if(seg.count > maxRoadResult) {	// maybe there is no vertex on this segment
			maxRoadResult = seg.count
		}
		seg.pass = true
		for(let vx of seg.vertex2) {
			iterMaxRoad(seg, vx, seg.count)
		}
		seg.pass = undefined
	}
	return maxRoadResult
}

function iterMaxRoad(startSeg, startV, len) {
	if(len > maxRoadResult) {
		maxRoadResult = len
	}
	for(let seg of startV.segments) {
		if(seg != startSeg && !seg.pass) {
			let newLen = len + seg.count
			if(seg.vertex2.length < 2) {	// end of path
				if(newLen > maxRoadResult) {
					maxRoadResult = newLen
				}
			} else {
				seg.pass = true
				iterMaxRoad(seg, startV == seg.vertex2[0] ? seg.vertex2[1] : seg.vertex2[0], newLen)
				seg.pass = undefined
			}
		}
	}
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
		try {
			player.allRoad = getRoadLength(player)
		} catch (e) {console.error(e)}
		addLog(player.color + ' built a road', 'brown')
		checkMaxRoad(player)
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
			addLog(player.color + ' built a city', 'brown')
		} else {
			if(slot.exchange >= 0) {
				player.exchange[slot.exchange] = true
				updateExchangeRate()
			}
			player.settlement--
			addLog(player.color + ' built a settlement', 'brown')
		}
	} else if(type == robber) {
		robberToken.tile = slot
	}
	curToken.shift()
}

// when a settlement is place, need to update all road to see if blocked
function calcAllRoads() {
	let max = 0
	let maxPlayer
	for(let player of players) {
		try {
			player.allRoad = getRoadLength(player)
			if(player.allRoad >= 5 && player.allRoad > max) {
				max = player.allRoad
				maxPlayer = player
			}
		} catch (e) {console.error(e)}
	}
	if(maxRoadPlayer != maxPlayer) {
		if(maxPlayer) {
			maxRoadPlayer = maxPlayer
			addLog(maxRoadPlayer.color + ' got 2 points of Longest Road', 'brown')
		} else {
			maxRoadPlayer = undefined
		}
	}
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
			if(token.type == settlement && stage == stagePlay) {
				calcAllRoads()
			}
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
			addToken(player, token.tile, token.type)
			// check if there's anyone to rob
			let canRob = new Set()
			for(let slot of robberToken.tile.vSlot) {
				if(slot.token && slot.token.player.id != curPlayer) {
					canRob.add(slot.token.player)
				}
			}
			if(canRob.size > 1) {
				curToken.push({
					type: robber3
				})
				blinkPlayer()
			} else {
				// only one player can be robbed is in that area
				doSteal(player, canRob.values().next().value)
			}

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
	// check if anyone needs to drop a half
	for(let player of players) {
		let sum = 0
		for(let num of player.res) {
			sum += num
		}
		if(sum > 7) {
			robPlayers.push({
				player: player,
				count: sum >> 1
			})
		}
	}
	if(robPlayers.length > 0) {
		blinkRes()
		curToken.push({
			type: robber2
		})
		saveCurPlayer = curPlayer
		curPlayer = robPlayers[0].player.id
		updatePlayerDisplay()
	}
}

function checkMaxArmy(player, log = false) {
	if(player.allSoldier >= 3) {
		if(!maxArmyPlayer || player.allSoldier > maxArmyPlayer.allSoldier) {
			maxArmyPlayer = player
			if(log) {
				addLog(player.color + ' got 2 points of Largest Army', 'brown')
			}
		}
	}
}
function checkMaxRoad(player) {
	if(player.allRoad >= 5) {
		if(!maxRoadPlayer || player.allRoad > maxRoadPlayer.allRoad) {
			maxRoadPlayer = player
			if(stage == stagePlay) {
				addLog(maxRoadPlayer.color + ' got 2 points of Longest Road', 'brown')
			}
		}
	}
}

function useDevelop(i) {
	let player = players[curPlayer]
	let devId = player.develop[i]
	let dev = devTypes[devId]
	switch(dev.type) {
		case soldier: {
			rob()
			player.allSoldier++
			checkMaxArmy(player)
			break;
		}
		case yearOfPlenty: {
			curToken.push({
				type: yearOfPlenty
			})
			curToken.push({
				type: yearOfPlenty
			})
			blinkRes()
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
			blinkRes()
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
			addLog(player.color + ' produced 1 ' + resourceNames[res], 'green')
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
			addLog(player.color + ' got ' + sum + ' ' + resourceNames[res] + ' by monopoly', 'purple')
			curToken.shift()
			drawRes()
			drawAll()
		} else if(token.type == robber2) {
			if(player.res[res] > 0) {
				player.res[res]--
				let robPlayer = robPlayers[0]
				robPlayer.count--
				if(robPlayer.count <= 0) {
					robPlayers.shift()
					if(robPlayers.length > 0) {
						curPlayer = robPlayers[0].player.id
					} else {
						curPlayer = saveCurPlayer
						curToken.shift()
					}
					updatePlayerDisplay()
				}
				drawRes()
				drawAll()
			}
		}
	}
}

function clickPlayer(id) {
	let token = curToken[0]
	if(token && token.type == robber3) {
		if(id == curPlayer) {
			return
		}
		let isNear = false		// check if there is a settlement of this player that is near the robber
		for(let slot of robberToken.tile.vSlot) {
			if(slot.token && slot.token.player.id == id) {
				isNear = true
				break
			}
		}
		if(!isNear) {
			return
		}
		let player = players[curPlayer]
		let from = players[id]	// TODO steal from adjacent settlement or city
		doSteal(player, from)
		curToken.shift()
		drawAll()
		drawRes()
		btnNext.disabled = false
		btnConfirmBuy.disabled = true
		btnCancelBuy.disabled = true
	}
}

function doSteal(player, from) {
	let res = getRandomResource(from.res)
	if(res) {
		player.res[res]++
		from.res[res]--
		addLog(player.color + ' stole a ' + resourceNames[res] + ' from ' + from.color, 'purple')
	} else {
		addLog(player.color + ' stole nothing from ' + from.color, 'purple')
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

function next(needSave = true) {
	if(curToken[0]) {
		return
	}

	if(stage == stageInit) {
		stage = stageSettle1
		phase = 0
		curPlayer = 0
		updatePlayerDisplay()
		addInitialTokens()
	} else if(stage == stageSettle1) {
		if(needSave) {
			saveGame()
		}
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
		updatePlayerDisplay()
		addInitialTokens()
	} else if(stage == stageSettle2) {
		if(needSave) {
			saveGame()
		}
		removeHighlight()
		curPlayer--
		if(curPlayer < 0) {
			stage = stagePlay
			curPlayer = 0
		} else {
			addInitialTokens()
		}
		updatePlayerDisplay()
	} else {
		// move develement that just got, to usable list
		let player = players[curPlayer]
		if(player.develop2.length > 0) {
			player.develop = player.develop.concat(player.develop2)
			player.develop2 = []
		}
		if(needSave) {
			saveGame()
		}
		removeHighlight()
		curPlayer++
		if(curPlayer >= players.length) {
			curPlayer = 0
		}

		updatePlayerDisplay()
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
					addLog(player.color + ' produced ' + resStr, 'green')
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
}

function addLog(log, color) {
	let str = ''
	if(color) {
		str += '<font color="' + color + '">'
	}
	str += log + "<br>"
	
	if(color) {
		str += '</font>'
	}
	labelHistory.innerHTML += str
	labelHistory.scrollTop = labelHistory.scrollHeight
}

function blinkRes() {
	blinkStyle(resImg.style)
}
function blinkPlayer() {
	blinkStyle(cssRulePlayer.style)
}
function blinkStyle(style) {
	sleep(100).then(function() {
		style.backgroundColor = "red"
		return sleep(500)
	}).then(function() {
		style.backgroundColor = ""
		return sleep(500)
	}).then(function() {
		style.backgroundColor = "red"
		return sleep(500)
	}).then(function() {
		style.backgroundColor = ""
		return sleep(500)
	}).then(function() {
		style.backgroundColor = "red"
		return sleep(500)
	}).then(function() {
		style.backgroundColor = ""
		return sleep(500)
	})
}

const cssColor = [
	'#6666ff', '#ff4444', '#55ff55', '#ffff66', '#444444', '#66ff99'
]

let cssRulePlayer
function updatePlayerDisplay() {
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

function drawRes() {
	let player = players[curPlayer]
	for(let res = 1;res < 6;res++) {
		tableRes.rows[1].cells[res - 1].innerHTML = player.res[res]
	}
	for(let [index, p] of players.entries()) {
		p.allScore = p.score
	}
	if(maxArmyPlayer) {
		maxArmyPlayer.allScore += 2
	}
	if(maxRoadPlayer) {
		maxRoadPlayer.allScore += 2
	}
	for(let [index, p] of players.entries()) {
		tableScore.rows[index + 1].cells[1].innerHTML = p.allSoldier
		tableScore.rows[index + 1].cells[2].innerHTML = p.allRoad
		tableScore.rows[index + 1].cells[3].innerHTML = p.allScore
	}
	if(player.score >= 10) {
		addLog(player.color + ' has won the game', 'red')
	}
	labelRoad.innerHTML = player.road
	labelSettlement.innerHTML = player.settlement
	labelCity.innerHTML = player.city

	labelDev.innerHTML = devStack.length
}

const tokenInitPos = {
	x: 580,
	y: 30,
	interval: 35,
}
const devDrawPos = {
	x: 5.0,
	y: 7.5,
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
					grid/2.5, grid/2.5)
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
		} else if(token.type == robber || token.type == robber2 || token.type == robber3) {
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
	for(let devId of player.develop) {
		let dev = devTypes[devId]
		draw('dev' + dev.id, grid * devX + offsetX, grid * devDrawPos.y + offsetY, devDrawPos.width * grid, devDrawPos.height * grid)
		devX -= devDrawPos.interval
	}
	if(player.develop2.length > 0) {
		ctx.globalAlpha = 0.5
		for(let devId of player.develop2) {
			let dev = devTypes[devId]
			draw('dev' + dev.id, grid * devX + offsetX, grid * devDrawPos.y + offsetY, devDrawPos.width * grid, devDrawPos.height * grid)
			devX -= devDrawPos.interval
		}
		ctx.globalAlpha = 1
	}
}

function drawToken(token) {
	if(token.type == road) {
		draw(token.player.color + token.type, grid * token.slot.x + offsetX, grid * token.slot.y + offsetY, grid/3, grid/10, token.slot.rotate)
	} else {
		draw(token.player.color + token.type, grid * token.slot.x + offsetX, grid * token.slot.y + offsetY, grid/5, grid/5)
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

// check if this slot can put road
function canRoad(slot) {
	if(slot.token) {
		return false
	}
	for(let vc of slot.vConnect) {
		if(vc.token) {
			if(vc.token.player.id == curPlayer) {
				return true
			}
		} else {
			// if the vertex is empty, check roads that connect to it
			for(let ec of vc.eConnect) {
				if(ec.token && ec.token.player.id == curPlayer) {
					return true
				}
			}
		}
	}
	return false
}

// check if this slot can put settlement or city
function canSettle(slot, token) {
	if(token.type == city) {
		return slot.token && slot.token.type == settlement
	}
	if(slot.token) {
		return false
	}
	// no adjacent settlement is allowed
	for(let vc of slot.vConnect) {
		if(vc.token) {
			return false
		}
	}
	if(stage != stagePlay) {
		return true
	}
	for(let ec of slot.eConnect) {
		if(ec.token && ec.token.player.id == curPlayer) {
			return true
		}
	}
	return false
}

let dragX = null, dragY
function touchstart(ex, ey) {
	let token = curToken[0]
	if(token) {
		if(token.type == road) {
			for(let slot of eSlots) {
				let dx = (ex - offsetX) / grid - slot.x
				let dy = (ey - offsetY) / grid - slot.y
				if(dx * dx + dy * dy < 0.04 && canRoad(slot)) {
					token.slot = slot
					btnConfirmBuy.disabled = false
					break
				}
			}
		} else if(token.type == settlement || token.type == city) {
			for(let slot of vSlots) {
				let dx = (ex - offsetX) / grid - slot.x
				let dy = (ey - offsetY) / grid - slot.y
				if(dx * dx + dy * dy < 0.04 && canSettle(slot, token)) {
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
}

function touchmove(ex, ey) {
	
}

function touchend(ex, ey) {

}

let gameId = -1
let games = []
function saveGame() {
	try {
		let game = {
			id : gameId,
			stage : stage,
			robberTile: robberToken.tile.id,
			players : players.map(item => {
				return {
					id : item.id,
					road : item.road,
					settlement : item.settlement,
					city : item.city,
					allSoldier: item.allSoldier,
					allRoad: item.allRoad,
					res: item.res,
					score : item.score,
					develop : item.develop
				}
			}),
			tiles : tiles.map(item => {
				return {
					x : item.x,
					y : item.y,
					type : item.type.id,
					number : item.number
				}
			}),
			tokens : tokens.map(item => {
				return {
					tile: item.slot.tile.id,
					index: item.slot.index,
					player : item.player.id,
					type : item.type
				}
			}),
			devStack : devStack,
			curPlayer : curPlayer,
			log: labelHistory.innerHTML
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
	var count = 0, imgNum = 0
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

