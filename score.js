
let boardWidth = 50
var scores = {
    roadMap : undefined,
    cityMap : undefined,
    farmMap : undefined,
    cloisterMap : undefined,
    tileId : 0,
    board : [],

    initScore : function() {
        tileId = 0;
        for(let i = 0;i < boardWidth;i++) {
            this.board[i] = []
        }
    },
    addTile : function(tile) {
        this.board[tile.x][tile.y] = tile        // update board occupied
        tile.id = tileId
        tileId++
        tile.unfinished = []    // this part needs how many connections to fix
        tile.groups = []
        let places = tile.type.place

        
        for(let pt of nearRect) {
            let x = tile.x + pt[0]
            let y = tile.y + pt[1]
            let tile2 = this.board[x][y]
            if(tile2) {
                if(tile2.unfinished[tile2.type.cloisterIndex]) {
                    tile2.unfinished[tile2.type.cloisterIndex]--
                }
            }
        }

        for(let [index, place] of places.entries()) {
            if(place[2] == cloister) {
                let sum = 0     // tiles around cloister
                for(let pt of nearRect) {
                    let x = tile.x + pt[0]
                    let y = tile.y + pt[1]
                    if(this.board[x][y]) {
                        sum++
                    }
                }
                tile.unfinished[index] = 8 - sum
            } else if(place[2] == road || place[2] == city) {
                let group = undefined
                tile.unfinished[index] = place[3].length
                for(let con of place[3]) {
                    let conRotate = con + 4 - tile.rotate & 3
                    let conXY = connectRect[conRotate]
                    let tile2 = this.board[tile.x + conXY[0]][tile.y + conXY[1]]
                    if(tile2) {
                        tile.unfinished[index]--
                        let index2 = tile2.type.roadCityConnect[(oppositeCon4[conRotate] + tile2.rotate) & 3]
                        let group2 = tile2.groups[index2]
                        tile2.unfinished[index2]--
                        if(tile2.unfinished[index2] == 0) {
                            group2.unfinished--
                        }
                        if(group) {
                            // merge 2 groups
                            if(group != group2) {
                                group.unfinished += group2.unfinished
                                group.tokens = group.tokens.concat(group2.tokens)
                                group.members = group.members.concat(group2.members)
                                for(let item of group2.members) {
                                    item.tile.groups[item.index] = group
                                }
                            }
                        } else {
                            group = group2
                            tile.groups[index] = group2
                            group.members.push({tile : tile, index : index})
                            group.unfinished++
                        }
                    }
                }
                if(group) {
                    if(tile.unfinished[index] == 0) {
                        group.unfinished--
                    }
                } else {
                    tile.groups[index] = {
                        type : place[2],
                        unfinished : 1,
                        members : [{tile : tile, index : index}],
                        tokens : []
                    }
                }
            } else if(place[2] == farm) {
                let group = undefined
                for(let con of place[3]) {
                    let conRotate = con + 8 - (tile.rotate << 1) & 7
                    let conXY = connectRect[conRotate >> 1]
                    let tile2 = this.board[tile.x + conXY[0]][tile.y + conXY[1]]
                    if(tile2) {
                        let index2 = tile2.type.farmConnect[(oppositeCon8[conRotate] + (tile2.rotate << 1)) & 7]
                        let group2 = tile2.groups[index2]
                        if(group) {
                            // merge 2 groups
                            if(group != group2) {
                                group.tokens = group.tokens.concat(group2.tokens)
                                group.members = group.members.concat(group2.members)
                                for(let item of group2.members) {
                                    item.tile.groups[item.index] = group
                                }
                            }
                        } else {
                            group = group2
                            tile.groups[index] = group2
                            group.members.push({tile : tile, index : index})
                        }
                    }
                }
                if(group) {

                } else {
                    tile.groups[index] = {
                        type : place[2],
                        members : [{tile : tile, index : index}],
                        tokens : []
                    }
                }
            }
        }
    },

    // check completion for token
    checkToken : function () {
        tokens = tokens.filter(token => {
            if(token.done) {    // already calculated
                return false
            }
            if(token.type == farm) {
                return true
            }
            let tile = token.tile
            if(token.type == cloister) {
                if(tile.unfinished[token.index] == 0) {
                    token.player.score += 9
                    token.player.token++
                    token.tile.tokens[token.index] = undefined
                    return false
                }
                return true
            }
            let group = tile.groups[token.index]

            let finished = group.unfinished == 0
            if(finished) {
                let members = group.members
                let number = new Set(members.map(x => x.tile.id)).size
                let addScore;
                if(token.type == road) {
                    addScore = number
                } else if(token.type == city) {
                    if(number == 2) {
                        addScore = number
                    } else {
                        addScore = number * 2
                        for(let m of members) {
                            if(m.tile.type.star) {
                                addScore += 2
                            }
                        }
                    }
                }
                let tokenPlayers = []
                for(let token2 of group.tokens) {
                    token2.player.token++
                    token2.tile.tokens[token2.index] = undefined
                    token2.done = true
                    tokenPlayers.push(token2.player)
                }
                tokenPlayers = getTopNumber(tokenPlayers)
                for(let player of tokenPlayers) {
                    player.score += addScore
                }
            }
            return !finished
        })
    },

    // check final score when endgame
    checkFinalToken : function () {
        for(let token of tokens) {
            if(token.done) {    // already calculated
                continue
            }
            let tile = token.tile
            if(token.type == cloister) {
                token.player.score2 += 9 - tile.unfinished[token.index]
                token.done = true
                continue
            }
            let group = tile.groups[token.index]

            let members = group.members
            let number = new Set(members.map(x => x.tile.id)).size
            let addScore = 0;
            if(token.type == road) {
                addScore = number
            } else if(token.type == city) {
                addScore = number
                for(let m of members) {
                    if(m.tile.type.star) {
                        addScore++
                    }
                }
            } else if(token.type == farm) {
                let citys = new Set()   // add group here
                for(let m of members) {
                    let place = m.tile.type.place[m.index]
                    if(place[4]) {  // connect to city
                        for(let c of place[4]) {
                            if(m.tile.groups[c].unfinished == 0) {
                                citys.add(m.tile.groups[c])
                            }
                        }
                    }
                }
                addScore = citys.size * 4
            }
            let tokenPlayers = []
            for(let token2 of group.tokens) {
                token2.done = true
                tokenPlayers.push(token2.player)
            }
            tokenPlayers = getTopNumber(tokenPlayers)
            for(let player of tokenPlayers) {
                player.score2 += addScore
            }
        }
    },

    initTileType : function() {
        for(let [index, type] of tileTypes.entries()) {
            type.id = index
            type.roadCityConnect = [];
            type.farmConnect = [];
            for(let [index, place] of type.place.entries()) {
                if(place[2] == cloister) {
                    type.cloisterIndex = index
                }
                if(!place[3]) {
                    break;
                }
                for(let c of place[3]) {
                    if(place[2] == road) {
                        type.roadCityConnect[c] = index
                    } else if(place[2] == city) {
                        type.roadCityConnect[c] = index
                    } else if(place[2] == farm) {
                        type.farmConnect[c] = index
                    }
                }
            }
        }
    }
}

const nearRect = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
]

const connectRect = [
    [0, -1],
    [-1, 0],
    [0, 1],
    [1, 0],
]

const oppositeCon4 = [2, 3, 0, 1]
const oppositeCon8 = [5, 4, 7, 6, 1, 0, 3, 2]

// 1 1 1 2 2 3 4 4 4 -> 1 4
function getTopNumber(arr) {
    let res = []
    for(let i of arr) {
        if(res[i.id]) {
            res[i.id].cnt++
        } else {
            res[i.id] = {id : i, cnt : 1}
        }
    }
    let max = res.reduce((res, y) => {
        return res > y.cnt ? res : y.cnt
    }, 0)
    return res.filter(x => {
        return x.cnt == max
    }).map(x => {
        return x.id
    })
}