/*
Author: Andrew Wise

This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License. 
To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/3.0/ or send a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
*/

$(function(){ 

function Game(){
	this.savedState = [];
	this.elementList = [];
	this.newState = [];
	this._sizeX = 0;
	this._sizeY = 0;
	this.generation = 0;
	this.TPS = 10;
	this.renderHook;
	this.running = false;
	this.ready = true;
	this.rootElement;
	this.insertStack = [];
	this.saveState = function(){
		this.savedState = null;
		this.savedState = this.newState;
		this.newState = [];
		this.newState = this.savedState.slice(0);
		this.generation++;
	};
	this.DrawElement = function(x, y, val, adjacency){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			var el = this.getCellElement(x,y);
			el.removeClass();
			if(val){
				el.addClass('alive');
				el.addClass('survivor_' + val);
			}
			if(adjacency != undefined){
				if(adjacency[0]){ el.addClass('e'); }
				if(adjacency[1]){ el.addClass('ne'); }
				if(adjacency[2]){ el.addClass('n'); }
				if(adjacency[3]){ el.addClass('nw'); }
				if(adjacency[4]){ el.addClass('w'); }
				if(adjacency[5]){ el.addClass('sw'); }
				if(adjacency[6]){ el.addClass('s'); }
				if(adjacency[7]){ el.addClass('se'); }
			}
		}
	},
	this.CreateGrid = function(sizeX, sizeY, rootElement){
		var self = this;
		this._sizeX = sizeX;
		this._sizeY = sizeY;
		this.rootElement = rootElement;
		var gridHTML = "";
		for(var i = 0; i < sizeY; i++){
			for(var j = 0; j < sizeX; j++){
				this.savedState.push(0);
				var elementSize = Math.floor( this.rootElement.height() / this._sizeY);
				gridHTML += '<div x="'+j+'" y="'+i+'" style="height: '+elementSize+'px; width: '+elementSize+'px; top: '+i * elementSize+'px; left: '+j * elementSize+'px;"></div>';
			}
		}
		this.rootElement.append(gridHTML);
		$('div', this.rootElement).each(function(i, el) {
			self.elementList.push($(el));
		});
		this.rootElement.click(function(ev){
			self.insertStack.push({x: parseInt($(ev.target).attr('x')), y: parseInt($(ev.target).attr('y'))});
			self.DrawElement(parseInt($(ev.target).attr('x')), parseInt($(ev.target).attr('y')), 1);
		});
		this.newState = this.savedState.slice(0);
	};
	this.CreateFill = function(elementSize, rootElement){
		var self = this;
		this._sizeX = Math.floor(rootElement.width() / elementSize);
		this._sizeY = Math.floor(rootElement.height() / elementSize);
		this.rootElement = rootElement;
		var gridHTML = "";
		for(var i = 0; i < this._sizeY; i++){
			for(var j = 0; j < this._sizeX; j++){
				this.savedState.push(0);
				gridHTML += '<div x="'+j+'" y="'+i+'" style="height: '+elementSize+'px; width: '+elementSize+'px; top: '+i * elementSize+'px; left: '+j * elementSize+'px;"></div>';
			}
		}
		this.rootElement.append(gridHTML);
		$('div', this.rootElement).each(function(i, el) {
			self.elementList.push($(el));
		});
		this.rootElement.click(function(ev){
			self.insertStack.push({x: parseInt($(ev.target).attr('x')), y: parseInt($(ev.target).attr('y'))});
			self.DrawElement(parseInt($(ev.target).attr('x')), parseInt($(ev.target).attr('y')), 1);
		});
		this.newState = this.savedState.slice(0);
	};

	this.getSavedCellValue = function(x,y){ //TODO cycles can be saved here if check can be removed
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			return this.savedState[(y * this._sizeX) + x];
		} else {
			return 0;
		}
	};
	this.getCellElement = function(x,y){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			return this.elementList[(y * this._sizeX) + x];
		}
	};
	this.getNewCellValue = function(x,y){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			return this.newState[(y * this._sizeX) + x];
		}
	};
	this.setNewCellValue = function(x,y,val){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			this.newState[(y * this._sizeX) + x] = val ? this.getSavedCellValue(x,y) + 1 : 0;
		}
	};
	this.getSavedActiveCells = function(){
		var ret = [];
		var activeCells = new Set();
		for(var i = 0; i < this.savedState.length; i++){
			if(this.savedState[i] > 0){
				activeCells.add(i                  );//add all neighbours to set, set condition eliminates duplicates
				activeCells.add(i               + 1);
				activeCells.add(i - this._sizeX + 1);
				activeCells.add(i - this._sizeX    );
				activeCells.add(i - this._sizeX - 1);
				activeCells.add(i               - 1);
				activeCells.add(i + this._sizeX - 1);
				activeCells.add(i + this._sizeX    );
				activeCells.add(i + this._sizeX + 1);
			}
		}
		for(var i = 0; i < activeCells.length(); i++){
			ret.push({ y: Math.floor(activeCells.getItem(i) / this._sizeX), x: activeCells.getItem(i) % this._sizeX });
		}
		return ret;
	};
	this.calculateCell = function(_x, _y){
		var neighbours = this.getSavedCellNeighbours(_x,_y);
		var adjacency = neighbours.adjacency;
		if(neighbours.count < 2 || neighbours.count > 3){ 
			this.setNewCellValue(_x,_y,0); 
			this.DrawElement(_x, _y, 0);
		} else if(neighbours.count == 3){
			var val = this.getSavedCellValue( _x, _y);
			this.setNewCellValue( _x, _y, val + 1); 
			this.DrawElement(_x, _y, val + 1, adjacency);
		} else if(neighbours.count == 2){
			var val = this.getSavedCellValue( _x, _y);
			if(val > 0){
				this.setNewCellValue( _x, _y, val + 1); 
				this.DrawElement(_x, _y, val + 1, adjacency);
			}
		}
	};
	this.getSavedCellNeighbours = function(x,y){
		var ret = { count: 0, adjacency: [false, false, false, false, false, false, false, false] };
		if(this.getSavedCellValue(x + 1, y    )){ ret.count++; ret.adjacency[0] = true; }; //rotate, circle theory style, 0:0 top left
		if(this.getSavedCellValue(x + 1, y - 1)){ ret.count++; ret.adjacency[1] = true; };
		if(this.getSavedCellValue(x    , y - 1)){ ret.count++; ret.adjacency[2] = true; };
		if(this.getSavedCellValue(x - 1, y - 1)){ ret.count++; ret.adjacency[3] = true; };
		if(this.getSavedCellValue(x - 1, y    )){ ret.count++; ret.adjacency[4] = true; };
		if(this.getSavedCellValue(x - 1, y + 1)){ ret.count++; ret.adjacency[5] = true; };
		if(this.getSavedCellValue(x    , y + 1)){ ret.count++; ret.adjacency[6] = true; };
		if(this.getSavedCellValue(x + 1, y + 1)){ ret.count++; ret.adjacency[7] = true; };
		return ret;
	};
	this.loadPattern = function(pattern){
		if(!this.running){
			for(var i = 0; i < pattern.length; i++){
				for(var j = 0; j < pattern[0].length; j++){
					this.setNewCellValue(Math.floor((this._sizeX - pattern[0].length) / 2) + j, Math.floor((this._sizeY - pattern.length) / 2) + i, pattern[i][j]);
					this.DrawElement(Math.floor((this._sizeX - pattern[0].length) / 2) + j,  Math.floor((this._sizeY - pattern.length) / 2) + i, pattern[i][j]);
				}
			}
			this.saveState();
		}
	};
	this.processInsertStack = function(){
		var _pendingStack = [];
		for(var i = 0; i < this.insertStack.length; i++){
			var newCell = this.insertStack.pop();
			_pendingStack.push(newCell);
			this.setNewCellValue(newCell.x, newCell.y, this.getSavedCellValue() + 1);
		}
		this.saveState();
	};
	this.tick = function(){
		if(this.running && this.ready){
			this.ready = false;
			this.processInsertStack();
			var activeCells = this.getSavedActiveCells();
			if(activeCells.length === 0){ this.running = false; this.onFinish(); }
			for(var i = 0; i < activeCells.length; i++){
				this.calculateCell(activeCells[i].x, activeCells[i].y);
			}
			this.saveState();
			this.ready = true;
			//TODO apply adjacency styles after saving to get correct behaviour
		}
	};
	this.setTPS = function(_tps){
		this.TPS = _tps;
	};
	this.start = function(){
		var self = this;
		if(!this.running){
			this.running = true;
			var callMethod = function(){
				self.tick();
			};
			this.renderHook = setInterval(callMethod, (1 / self.TPS) * 1000);
		}
	};
	this.stop = function(){
		this.running = false;
		clearInterval(this.renderHook);
	};
	this.onFinish = function(){};
}

function run(){
	var game = new Game();
	game.setTPS(10);
	game.onFinish = function(){
		game.loadPattern([
			[1, 1, 0],
			[1, 0, 1],
			[1, 0, 0]
		]);
	};
	//game.CreateGrid(200,200,$('#grid'));
	game.CreateFill(10,$('#grid'));
	game.loadPattern([
		[1, 1, 0],
		[1, 0, 1],
		[1, 0, 0]
	]);
	$('#grid').click(function(){
		game.start();
	});
}

function Set(){
	var _array = [];
	var _index = [];
	this.add = function(_key){
		if(!this.contains(_key)){ //implemented as a set
			_array[_key.toString()] = _key;
			_index.push(_key);
		}
	};
	this.remove = function(_key){
		if(this.contains(_key)){
			delete _array[_key.toString()];
			for(var i = 0; i < _index.length; i++){
				if(_index[i] == _key){
					_index.splice(i,1);
					break; 
				}
			}
		}
	};
	this.contains = function(_key){
		return _array[_key.toString()] != undefined ? true : false; //quicker than using in keyword
	};
	this.length = function(){
		return _index.length; //advantage of having an index set is we can wrap around the native length function for efficient calculation
	};
	this.keyArray = function(){
		return _index.slice(0); //trick to efficiently clone an array
	};
	this.getItem = function(i){ //useful feature for stepping into dictionary when your not concerned about the key value i.e. printing all objects or sampling
		return _array[_index[i].toString()];
	};
	this.clear = function(){
		_index = null; _array = null; //missing this line is the best way of causing memory leaks, setting to null will remove any references so the garbage collector will collect the hanging objects
		_index = []; _array = [];
	};
}

run();


})();