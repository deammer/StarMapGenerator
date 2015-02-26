/**
 * @author Maxime Preaux
 */

// global constants
var WIDTH = document.body.offsetWidth;
var HEIGHT = document.body.offsetHeight - 200;

var PLANET_RADIUS = 20;
var PLANET_DISTANCE_MIN = 100;
var PLANET_DISTANCE_MAX = 200;
var PLANET_AMOUNT_MIN = 5;
var PLANET_AMOUNT_MAX = 30;

// grid constants
var CELL_SIZE = 80;
var GRID_PADDING_H = 50;
var GRID_PADDING_V = 50;
var CELL_EMPTY = "#222";
var CELL_OCCUPIED = "#86d048";
var CELL_LOCKED = "#ff451e";
var BORDER_COLOR = "#444";

// grid variables
var rows;
var columns;

// the cells
var cells;
var planet_cells = [];

// planets
var planets = [];
var images = [];

// links
var LINK_COLOR_1 = "#ffff00";
var LINK_COLOR_2 = "#ff00ff";
var LINK_COLOR_3 = "#00ffff";
var links = [];

// options
var options = {
	largeCells: true
}

// init
var canvases = {
	grid: document.getElementById('canvas-grid'),
	cells: document.getElementById('canvas-cells'),
	links: document.getElementById('canvas-links'),
	planets: document.getElementById('canvas-planets'),
	sprites: document.getElementById('canvas-sprites')
}

var contexts = {
	grid: canvases.grid.getContext('2d'),
	cells: canvases.cells.getContext('2d'),
	links: canvases.links.getContext('2d'),
	planets: canvases.planets.getContext('2d'),
	sprites: canvases.sprites.getContext('2d')
}

$(document).ready(function() {
	// load the sprite names
	var files = [];
	for (var i = 1; i <= 18; i++)
		files.push("planet_" + i + ".png");

	// load the images
	for (var i = 0; i < files.length; i++)
	{
		var image = new Image();
		image.src = files[i];
		images.push(image);
	}
});

function start() {
	// get vars from the settings
	PLANET_AMOUNT_MAX = planetSlider.getValue();
	CELL_SIZE = gridSlider.getValue();

	resizeCanvas();

	// 0. reset everything
	links = [];
	planets = [];
	planet_cells = [];

	// 1. setup the grid
	setupGrid();
	drawGrid();
	setupCells();

	// 2. set start planet
	var start_cell = {x: 0, y: Math.floor(rows * .5), color: CELL_OCCUPIED};
	cells[start_cell.x][start_cell.y].color = start_cell.color;
	planet_cells.push(start_cell);

	// 3. find cells
	findEmptyCells();
	drawCells();

	// 4. draw planets
	generatePlanets();
	drawPlanets();

	// 5. draw connections
	generateConnections();
	drawConnections();

	// 6. draw sprites!
	drawSprites();

	// 7. update the stats
	$('span#planet-count').html(planets.length);
	$('span#links-count').html(links.length);
}

function resizeCanvas() {
	WIDTH = document.body.offsetWidth;
	HEIGHT = document.body.offsetHeight - $('#menu').outerHeight();
	var _height = $('#menu').outerHeight();
	$('canvas').each(function() {
		$(this).css('top', _height + 'px');
	})

	// update the canvases
	canvases.grid.width  = WIDTH;
	canvases.planets.width = WIDTH;
	canvases.links.width = WIDTH;
	canvases.cells.width = WIDTH;
	canvases.sprites.width = WIDTH;

	canvases.grid.height = HEIGHT;
	canvases.planets.height = HEIGHT;
	canvases.links.height = HEIGHT;
	canvases.cells.height = HEIGHT;
	canvases.sprites.height = HEIGHT;

	// clear the contexts
	contexts.grid.clearRect(0, 0, canvases.grid.width, canvases.grid.height);
	contexts.planets.clearRect(0, 0, canvases.planets.width, canvases.planets.height);
	contexts.links.clearRect(0, 0, canvases.links.width, canvases.links.height);
	contexts.cells.clearRect(0, 0, canvases.cells.width, canvases.cells.height);
	contexts.sprites.clearRect(0, 0, canvases.sprites.width, canvases.sprites.height);
}

// calculate the dimensions of the grid
function setupGrid() {
	rows = Math.floor((HEIGHT - GRID_PADDING_H * 2) / CELL_SIZE);
	columns = Math.floor((WIDTH - GRID_PADDING_V * 2) / CELL_SIZE);
}

// get a list of empty cells
function getEmptyCells() {
	var empty_cells = [];
	
	for (var c = 0; c < columns; c++)
	{
		for (var r = 0; r < rows; r++)
		{
			if (cells[c][r].color === CELL_EMPTY)
				empty_cells.push(cells[c][r]);
		}
	}

	return empty_cells;
}

// initialize a bunch of empty cells
function setupCells() {
	cells = new Array(columns);

	var cell;
	for (var c = 0; c < columns; c++)
	{
		cells[c] = new Array(rows);

		for (var r = 0; r < rows; r++)
		{
			cell = {x: c, y:r, color: CELL_EMPTY};
			cells[c][r] = cell;
		}
	}
}

// block in which cells the planets will go into
function findEmptyCells() {
	var empty_cells = getEmptyCells();
	while (planet_cells.length < PLANET_AMOUNT_MAX && empty_cells != null && empty_cells.length > 0)
	{
		// block the cells we can't use
		for (var i = 0; i < planet_cells.length; i++)
		{
			cell = planet_cells[i];

			// top left
			if (cell.x > 0 && cell.y > 0)
				cells[cell.x - 1][cell.y - 1].color = CELL_LOCKED;

			// top right
			if (cell.x < columns - 1 && cell.y > 0)
				cells[cell.x + 1][cell.y - 1].color = CELL_LOCKED;

			// bottom right
			if (cell.x < columns - 1 && cell.y < rows - 1)
				cells[cell.x + 1][cell.y + 1].color = CELL_LOCKED;

			// bottom left
			if (cell.x > 0 && cell.y < rows - 1)
				cells[cell.x - 1][cell.y + 1].color = CELL_LOCKED;

			// top
			if (cell.y > 0)
				cells[cell.x][cell.y - 1].color = CELL_LOCKED;

			// right
			if (cell.x < columns - 1)
				cells[cell.x + 1][cell.y].color = CELL_LOCKED;

			// bottom
			if (cell.y < rows - 1)
				cells[cell.x][cell.y + 1].color = CELL_LOCKED;

			// left
			if (cell.x > 0)
				cells[cell.x - 1][cell.y].color = CELL_LOCKED;

			if (options.largeCells)
			{
				// top
				if (cell.y > 1)
					cells[cell.x][cell.y - 2].color = CELL_LOCKED;

				// right
				if (cell.x < columns - 2)
					cells[cell.x + 2][cell.y].color = CELL_LOCKED;

				// bottom
				if (cell.y < rows - 2)
					cells[cell.x][cell.y + 2].color = CELL_LOCKED;

				// left
				if (cell.x > 1)
					cells[cell.x - 2][cell.y].color = CELL_LOCKED;
			}
		}

		empty_cells = getEmptyCells();

		if (empty_cells.length > 0)
		{
			var index = Math.floor(Math.random() * empty_cells.length);
			cells[empty_cells[index].x][empty_cells[index].y].color = CELL_OCCUPIED;
			planet_cells.push(empty_cells[index]);
			empty_cells.splice(index, 1);
		}
	}
}

// draw the cells
function drawCells() {
	var cell;
	for (var c = 0; c < columns; c++)
	{
		for (var r = 0; r < rows; r++)
		{
			cell = cells[c][r];
			drawCell(cell.x, cell.y, cell.color);
		}
	}
}

// create a planet for each planet cell
function generatePlanets() {
	planets = [];
	for (var i = 0; i < planet_cells.length; i++)
	{
		var planet = {
			x: GRID_PADDING_H + PLANET_RADIUS + (CELL_SIZE - PLANET_RADIUS * 2) * Math.random() + planet_cells[i].x * CELL_SIZE,
			y: GRID_PADDING_V + PLANET_RADIUS + (CELL_SIZE - PLANET_RADIUS * 2) * Math.random() + planet_cells[i].y * CELL_SIZE,
			numConnections: 0,
			connectedToStart: false,
			planetsConnected: [],
			index: i
		}
		planets.push(planet);
	}
}

// sets the planet's 'connectedToStart' to true, and do the same
// for its neighbors (recursively)
function setConnectedToStart(planet_index) {
	var planet = planets[planet_index];
	if (planet.connectedToStart == false)
	{
		planet.connectedToStart = true;

		if (planet.planetsConnected != null)
		{
			for (var i = 0; i < planet.planetsConnected.length; i++)
				setConnectedToStart(planet.planetsConnected[i]);
		}
	}
}

// create connections between all the planets
function generateConnections() {
	// the start planet is connected, obviously
	setConnectedToStart(0);

	var distance;

	// 1. link each planet to its closest neighbor
	for (var i = 0; i < planets.length; i++)
	{
		if (planets[i].numConnections == 0)
		{
			distance = (columns + rows) * CELL_SIZE;
			var closest = -1;

			for (var p = 0; p < planets.length; p++)
			{
				if (p != i) // if this is not the current planet 
				{
					var d = distanceBetweenPoints(planets[i].x, planets[i].y, planets[p].x, planets[p].y);
					if (d < distance)
					{
						distance = d;
						closest = p;
					}
				}
			}

			// add a new link
			var link = {point1: {x: planets[i].x,
								y: planets[i].y},
						point2: {x: planets[closest].x,
								y: planets[closest].y},
						pass: 1
						};
			planets[i].numConnections ++;
			planets[i].planetsConnected.push(closest)
			planets[closest].numConnections ++;
			planets[closest].planetsConnected.push(i);
			links.push(link);

			// update the connectedToStart bool
			if (planets[i].connectedToStart)
				setConnectedToStart(closest);
			else if (planets[closest].connectedToStart)
				setConnectedToStart(i);
		}
	}

	// 2. while we have some non_connected planets, find the closest pair
	//    of connected/non_connected and link them
	var non_connected = getConnectedPlanets(false); // returns a list of planets
	while (non_connected != null && non_connected.length > 0)
	{
		var connected = getConnectedPlanets(true);
		distance = (columns + rows) * CELL_SIZE;

		var closest_pair = {connected: -1, non_connected: -1}; // indices of planets

		for (var nc = 0; nc < non_connected.length; nc++)
		{
			for (var c = 0; c < connected.length; c++)
			{
				var d = distanceBetweenPoints(non_connected[nc].x,
												non_connected[nc].y,
												connected[c].x,
												connected[c].y);
				if (d < distance)
				{
					distance = d;
					closest_pair.connected = connected[c].index;
					closest_pair.non_connected = non_connected[nc].index;
				}
			}
		}

		// add a new link
		var planet_connected = planets[closest_pair.connected];
		var planet_non_connected = planets[closest_pair.non_connected];

		var link = {point1: {x: planet_connected.x,
							y: planet_connected.y},
					point2: {x: planet_non_connected.x,
							y: planet_non_connected.y},
					pass: 2
					};
		planet_connected.numConnections ++;
		planet_connected.planetsConnected.push(closest_pair.non_connected)
		planet_non_connected.numConnections ++;
		planet_non_connected.planetsConnected.push(closest_pair.connected);
		links.push(link);

		setConnectedToStart(closest_pair.non_connected);
		non_connected = getConnectedPlanets(false);
	}

	// 3. try adding an extra connection to each planet, in case there's
	//    something nearby
	var planets_to_check = planets.slice(0); // clones the array
	var max_distance = 3 * CELL_SIZE;
	var added = false;
	for (var i = planets_to_check.length - 1; i >= 0; i--)
	{
		added = false;
		for (var p = planets_to_check.length - 1; p >= 0; p--)
		{
			if (added) break;

			if (p != i && planets_to_check[i].planetsConnected.indexOf(planets_to_check[p].index) == -1)
			{
				distance = distanceBetweenPoints(planets_to_check[i].x,
													planets_to_check[i].y,
													planets_to_check[p].x,
													planets_to_check[p].y);
				if (distance < max_distance)
				{
					var link = {point1: {x: planets_to_check[i].x,
										y: planets_to_check[i].y},
								point2: {x: planets_to_check[p].x,
										y: planets_to_check[p].y},
								pass: 3
								};
					planets_to_check[i].numConnections ++;
					planets_to_check[i].planetsConnected.push(p)
					planets_to_check[p].numConnections ++;
					planets_to_check[p].planetsConnected.push(i);
					links.push(link);

					planets_to_check.splice(i, 1);

					added = true;
				}
			}
		}
	}
}

// get the of planets connected to the starting planet
function getConnectedPlanets(connected) {
	var list = [];

	for (var i = 0; i < planets.length; i++)
	{
		if (planets[i].connectedToStart == connected)
			list.push(planets[i]);
	}

	return list;
}

// draw the grid
function drawGrid() {
	var context = contexts.grid;

	context.beginPath();
	context.lineWidth = 2;
	context.strokeStyle = BORDER_COLOR;

	var x = 0;
	for (x = 0; x <= columns; x++)
	{
		context.moveTo(GRID_PADDING_H + x * CELL_SIZE, GRID_PADDING_V);
		context.lineTo(GRID_PADDING_H + x * CELL_SIZE, GRID_PADDING_V + rows * CELL_SIZE);
	}
	var y = 0;
	for (y = 0; y <= rows; y++)
	{
		context.moveTo(GRID_PADDING_H, GRID_PADDING_V + y * CELL_SIZE);
		context.lineTo(GRID_PADDING_H + columns * CELL_SIZE, GRID_PADDING_V + y * CELL_SIZE);
	}

	context.stroke();
}

// draw the planets as circles
function drawPlanets() {
	for (var i = 0; i < planets.length; i++)
	{
		drawPlanet(planets[i].x, planets[i].y);
	}
}

function drawPlanet(x, y) {
	var context = contexts.planets;

	context.beginPath();
	context.arc(x, y, PLANET_RADIUS, 0, 2 * Math.PI, false);
	context.fillStyle = "#616ea0";
	context.fill();
	context.lineWidth = 5;
	context.strokeStyle = "#515e90";
	context.stroke();	
	
}

// draw a cell
function drawCell(colum, row, color) {
	var context = contexts.cells;

	context.beginPath();
	context.rect(GRID_PADDING_H + colum * CELL_SIZE, GRID_PADDING_V + row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
	context.lineWidth = 2;
	context.strokeStyle = BORDER_COLOR;
	context.stroke();
	context.fillStyle = color;
	context.fill();
}

// draw the links between planets
function drawConnections() {
	var context = contexts.links;

	for (var i = 0; i < links.length; i++)
	{
		context.beginPath();
		context.moveTo(links[i].point1.x, links[i].point1.y);
		context.lineTo(links[i].point2.x, links[i].point2.y);

		context.lineCap = 'round'
		if (links[i].pass == 1)
		{
			context.strokeStyle = LINK_COLOR_1;
			context.lineWidth = 6;
		}
		else if (links[i].pass == 2)
		{
			context.strokeStyle = LINK_COLOR_2;
			context.lineWidth = 4;
		}
		else
		{
			context.strokeStyle = LINK_COLOR_3;
			context.lineWidth = 2;
		}

		context.stroke();
	}
}

// draw the planet sprites
function drawSprites() {
	var size = CELL_SIZE * .6;
	var a = 0;

	for (var i = 0; i < planets.length; i++)
	{
		contexts.sprites.drawImage(images[a], planets[i].x - size * .5, planets[i].y - size * .5, size, size);

		a++;
		if (a >= images.length)
			a = 0;
	}
}

// get the distance between two points
function distanceBetweenPoints(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}
