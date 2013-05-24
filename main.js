$(function(){ 

function Game(){
	this.savedState = [];
	this.elementList = [];
	this.newState = [];
	this._sizeX = 0;
	this._sizeY = 0;
	this.generation = 0;
	this.running = false;
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
	this.Create = function(sizeX, sizeY, rootElement){
		this._sizeX = sizeX;
		this._sizeY = sizeY;
		this.rootElement = rootElement;
		for(var i = 0; i < sizeY; i++){
			for(var j = 0; j < sizeX; j++){
				this.savedState.push(0);
				this.elementList.push(this.ElementFactory(j,i,this.rootElement));
			}
		}
		this.newState = this.savedState.slice(0);
	};
	this.CreateNew = function(sizeX, sizeY, rootElement){
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
	this.getSavedCellValue = function(x,y){ //TODO cycles can be saved here if check can be removed
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			return this.savedState[(y * this._sizeY) + x];
		} else {
			return 0;
		}
	};
	this.getCellElement = function(x,y){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			return this.elementList[(y * this._sizeY) + x];
		}
	};
	this.getNewCellValue = function(x,y){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			return this.newState[(y * this._sizeY) + x];
		}
	};
	this.setNewCellValue = function(x,y,val){
		if(x >= 0 && y >= 0 && x < this._sizeX && y < this._sizeY){
			this.newState[(y * this._sizeY) + x] = val ? this.getSavedCellValue(x,y) + 1 : 0;
		}
	};
	this.getSavedActiveCells = function(){
		var ret = [];
		for(var i = 0; i < this.savedState.length; i++){
			if(this.savedState[i] > 0){
				var division = Math.floor(i / this._sizeY);
				ret.push({ y: division, x: i % this._sizeY });
			}
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
	this.calculateNeighbourhood = function(x, y){
		this.calculateCell(x    , y    );
		this.calculateCell(x + 1, y    );
		this.calculateCell(x + 1, y - 1);
		this.calculateCell(x    , y - 1);
		this.calculateCell(x - 1, y - 1);
		this.calculateCell(x - 1, y    );
		this.calculateCell(x - 1, y + 1);
		this.calculateCell(x    , y + 1);
		this.calculateCell(x + 1, y + 1);
	};
	this.loadPattern = function(x,y,pattern){
		if(!this.running){
			for(var i = 0; i < pattern.length; i++){
				for(var j = 0; j < pattern[0].length; j++){
					this.setNewCellValue(x + j, y + i, pattern[i][j]);
					this.DrawElement(x + j, y + i, pattern[i][j]);
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
		if(this.running){
			this.processInsertStack();
			var activeCells = this.getSavedActiveCells();
			if(activeCells.length === 0){ this.running = false; this.onFinish(); }
			for(var i = 0; i < activeCells.length; i++){
				this.calculateNeighbourhood(activeCells[i].x, activeCells[i].y);
			}
			this.saveState();
			var self = this;
			var callMethod = function(){
				self.tick();
			};
			//TODO apply adjacency styles after saving to get correct behaviour
			setTimeout(callMethod,100);
		}
	};
	this.start = function(){
		if(!this.running){
			this.running = true;
			this.tick();
		}
	};
	this.stop = function(){
		this.running = false;
	};
	this.onFinish = function(){
	
	};
}

function run(){
	var game = new Game();
	game.onFinish = function(){
		game.loadPattern(24,24,[
			[1, 1, 0],
			[1, 0, 1],
			[1, 0, 0]
		]);
	};
	game.CreateNew(100,100,$('#grid'));
	game.loadPattern(24,24,[
		[1, 1, 0],
		[1, 0, 1],
		[1, 0, 0]
	]);
	$('#grid').click(function(){
		game.start();
	});
}

run();

})();