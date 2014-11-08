var SpatialHash = function(w, h, s)
{
    this.width = w || 0;
    this.height = h || 0;

    this.cellSize = s || 0;
    this.cw = Math.floor(w / s);
    this.ch = Math.floor(h / s);

    this.array = new Array(this.cw);
    for(i = 0; i < this.cw; i++) {
        this.array[i] = new Array(this.ch);
        for(j = 0; j < this.ch; j++)
            this.array[i][j] = [];
    }
}

SpatialHash.prototype =
{
    hash: function(val)
    {
        var sx = Math.max(0, Math.min(Math.floor(val.x / this.cellSize), this.cw - 1));
        var sy = Math.max(0, Math.min(Math.floor(val.y / this.cellSize), this.ch - 1));

        return new Vector(sx, sy);
    },

    insert: function(val)
    {
        var sPos = this.hash(val);
        this.array[sPos.x][sPos.y].push(val);
    },

    insertCircle: function(val)
    {
        val.hashR = Math.ceil(val.r / this.cellSize);
        var x = val.hashR;
        var y = 0;
        var radiusError = 1 - x;

        var sPos = this.hash(val);

        while(x >= y) {
            if(x + sPos.x < this.cw && y + sPos.y < this.ch) this.array[x + sPos.x][y + sPos.y].push(val);
            if(y + sPos.x < this.cw && x + sPos.y < this.ch) this.array[y + sPos.x][x + sPos.y].push(val);
            if(-x + sPos.x >= 0 && y + sPos.y < this.ch) this.array[-x + sPos.x][y + sPos.y].push(val);
            if(-y + sPos.x >= 0 && x + sPos.y < this.ch) this.array[-y + sPos.x][x + sPos.y].push(val);
            if(-x + sPos.x >= 0 && -y + sPos.y >= 0) this.array[-x + sPos.x][-y + sPos.y].push(val);
            if(-y + sPos.x >= 0 && -x + sPos.y >= 0) this.array[-y + sPos.x][-x + sPos.y].push(val);
            if(x + sPos.x < this.cw && -y + sPos.y >= 0) this.array[x + sPos.x][-y + sPos.y].push(val);
            if(y + sPos.x < this.cw && -x + sPos.y >= 0) this.array[y + sPos.x][-x + sPos.y].push(val);

            y++;
            if(radiusError < 0) {
                radiusError += 2 * y + 1;
            } else {
                x--;
                radiusError += 2 * (y - x + 1);
            }
        }
    },

    search: function(val)
    {
        var sPos = this.hash(val);

        var objs = [];
        for(k = 0; k < this.array[sPos.x][sPos.y].length; k++)
            objs.push(this.array[sPos.x][sPos.y][k]);

        return objs;
    },

    wideSearch: function(val)
    {
        var sPos = this.hash(val);

        var planet;
        var enemy = false;

        var objs = [];
        for(p = -1; p < 2; p++) {
            var sx = (sPos.x + p) % this.cw;
            if(sx < 0) sx = this.cw + sx;
            for(j = -1; j < 2; j++) {
                var sy = (sPos.y + j) % this.ch;
                if(sy < 0) sy = this.ch + sy;
                for(k = 0; k < this.array[sx][sy].length; k++) {
                    if(this.array[sx][sy][k].hashR != undefined)
                        planet = this.array[sx][sy][k];
                    else if(val.owner != this.array[sx][sy][k].owner)
                        enemy = true;

                    objs.push(this.array[sx][sy][k]);
                }
            }
        }
        if(planet) {
            if(enemy)
                objs.push(planet);
            else
                return [planet];
        }

        return objs;
    },

    update: function()
    {
        for(i = 0; i < this.array.length; i++) {
            for(j = 0; j < this.array[i].length; j++) {
                for(k = 0; k < this.array[i][j].length; k++) {
                    var curr = this.array[i][j][k];
                    // Reset the collision mask, this is a convenient place to
                    // do it
                    curr.collided = false;
                    if(curr.hashR) {
                        var radius = Math.ceil(curr.r / this.cellSize);
                        // Check for circles, and remove if found
                        if(curr.remove) {
                            var l = this.array[i][j].length;
                            this.array[i][j][k] = this.array[i][j][l - 1];
                            this.array[i][j].pop();
                            k--;
                        } else if(radius != curr.hashR) {
                            this.removeCircle(i, j, curr);
                            curr.hashR = radius;
                            this.insertCircle(curr);
                        }
                    } else {
                        var sPos = this.hash(curr);
                        if(sPos.x != i || sPos.y != j || curr.removed) {
                            var l = this.array[i][j].length;
                            this.array[i][j][k] = this.array[i][j][l - 1];
                            this.array[i][j].pop();
                            k--;

                            if(!curr.removed)
                                this.array[sPos.x][sPos.y].push(curr);
                        }
                    }
                }
            }
        }
    },

    removeCircle: function(x, y, val)
    {
        for(m = x; m < Math.min(x + (2 * val.hashR) + 1, this.cw); m++) {
            for(n = Math.max(0, y - val.hashR - 1); n < Math.min(y + val.hashR, this.ch); n++) {
                for(p = 0; p < this.array[m][n].length; p++) {
                    if(this.array[m][n][p] == val) {
                        var l = this.array[m][n].length;
                        this.array[m][n][p] = this.array[m][n][l - 1];
                        this.array[m][n].pop();
                        p--;
                    }
                }
            }
        }
    }
}
