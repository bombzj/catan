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

const allColors = [
	'blue', 'red', 'green', 'yellow', 'white', 'brown'
]

const tileTypes = [
	{	// desert	
		start: true,
		count:	1,
	},
	{	// pasture		
		count:	4,
		resource: wool,
	},
	{	// field	
		count:	4,
		resource: grain,
	},
	{	// forest	
		count:	4,
		resource: wood,
	},
	{	// hill
		count:	3,
		resource: brick,
	},
	{	// mountain
		count:	3,
		resource: ore,
	},
]

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