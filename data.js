const desert = 0
const pasture = 1
const field = 2
const forest = 3
const hill = 4
const mountain = 5

const wool = 1
const grain = 2
const wood = 3
const brick = 4
const ore = 5

const road = 1
const settlement = 2
const city = 3

const stageInit = 0
const stageSettle1 = 1
const stageSettle2 = 2
const stagePlay = 3


const allColors = [
	'blue', 'red', 'green', 'yellow', 'white', 'brown'
]

const tileTypes = [
	{
		start: true,
		count:	1,
		name: 'desert'
	},
	{	// 		
		count:	4,
		resource: wool,
		name: 'pasture'
	},
	{	// 	
		count:	4,
		resource: wood,
		name: 'forest'
	},
	{	// 	
		count:	4,
		resource: grain,
		name: 'field'
	},
	{	// 
		count:	3,
		resource: brick,
		name: 'hill'
	},
	{	// 
		count:	3,
		resource: ore,
		name: 'mountain'
	},
]

let tokenCost = []
tokenCost[road] = [0, 0, 1, 0, 1, 0]
tokenCost[settlement] = [0, 1, 1, 1, 1, 0]
tokenCost[city] = [0, 0, 0, 2, 0, 3]

const square3 = Math.sqrt(3)/2
const hexVertexOffset = [
	[-0.25/square3, -1/2],
	[0.25/square3, -1/2],
	[0.5/square3, 0],
	[0.25/square3, 1/2],
	[-0.25/square3, 1/2],
	[-0.5/square3, 0],
]

const hexEdgeOffset = [
	[0, -1/2],
	[square3/2, -1/4],
	[square3/2, 1/4],
	[0, 1/2],
	[-square3/2, 1/4],
	[-square3/2, -1/4],
]

const seaPos = [
	[3.4, 2.15, 1/12],
	[5, 4, 3/12],
	[4.15, 6.4, 5/12],
	[1.75, 6.85, 7/12],
	[0.1, 4.96, 9/12],
	[0.95, 2.6, 11/12],
]

const vMatch = [
	[-1, 0, 2,		0, -1, 4],
	[0, -1, 3,		1, -1, 5],
	[1, -1, 4,		1, 0, 0],
	[1, 0, 5,		0, 1, 1],
	[0, 1, 0,		-1, 1, 2],
	[-1, 1, 1,		-1, 0, 3],
]
const eMatch = [
	[0, -1, 3],
	[1, -1, 4],
	[1, 0, 5],
	[0, 1, 0],
	[-1, 1, 1],
	[-1, 0, 2],
]

const tilePos = [
	[3, 3],
	[3, 2],
	[2, 3],
	[2, 4],
	[3, 4],

	[4, 3],
	[4, 2],
	[5, 1],
	[5, 2],
	[5, 3],

	[4, 4],
	[3, 5],
	[2, 5],
	[1, 5],
	[1, 4],

	[1, 3],
	[2, 2],
	[3, 1],
	[4, 1],
]