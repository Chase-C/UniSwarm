var Planet = function(x, y, r, zero)
{
    // Position
    this.x = x || 0;
    this.y = y || 0;
    //Radius
    this.maxR = r || 0;
    if(zero)
        this.r = 0.1;
    else
        this.r = Math.random() * (this.maxR - 8) + 4;
    this.hashR = 0;

    this.owner = 0;

    this.p1Circling = 0;
    this.p2Circling = 0;

    this.reserve = Math.floor(this.r / 2);
    this.rate = Math.max(350, (2200 - (32 * this.r)) * (this.reserve / this.r));

    // Color
    this.color = new Color(196, 196, 196);

    this.growing = true;
    this.remove = false;

    // Particle production timer
    this.ptime = 0;
    // Particle release timer
    this.rtime = 0;
    // How long the planets stays at its largest size
    this.wtime = Math.random() * 6000 + 6000;
}

Planet.prototype =
{
    // Getter and setter methods
    getX: function() { return this.x },
    setX: function(x) { this.x = x },
    
    getY: function() { return this.y },
    setY: function(y) { this.y = y },

    getRadius: function() { return this.r },
    maxRadius: function() { return this.maxR },

    // Get the position as a vector
    posVector: function()
    {
        return new Vector(this.x, this.y);
    },

    setPlayer1Planet: function()
    {
        this.owner = 1;
        this.color = this.color.Pink();

        this.maxR += (Math.random() * 6) + 2;
    },

    setPlayer2Planet: function()
    {
        this.owner = 2;
        this.color = this.color.Cyan();

        this.maxR += (Math.random() * 6) + 2;
    },

    unsetPlayerPlanet: function()
    {
        this.owner = 0;
        this.color = new Color(196, 196, 196);
    },

    // Return true if this planet is ready to produce a new particle
    releaseReady: function(dt)
    {
        this.rtime += dt;
        if(this.rtime >= 80) {
            this.rtime = this.rtime - 80;
            return true;
        }
        return false;
    },

    // Return true if this planet is ready to produce a new particle
    particleReady: function(dt)
    {
        this.ptime += dt;
        if(this.ptime >= this.rate) {
            this.ptime = this.ptime - this.rate;
            return true;
        }
        return false;
    },

    // Get a random point on the planet's surface
    getRandSurfacePoint: function()
    {
        var angle = Math.random() * Math.PI * 2;
        var x = Math.cos(angle) * this.r;
        var y = Math.sin(angle) * this.r;

        return new Vector(x + this.x, y + this.y);
    },

    update: function(dt)
    {
        if(this.growing && this.r < this.maxR) {
            this.r += (dt / 1600) * (this.maxR / this.r);
            if(this.r > this.maxR) {
                this.r = this.maxR;
                this.growing = false;
            }
        } else if(!this.growing && this.wtime > 0) {
            this.wtime -= dt;
        } else {
            if(this.r > (this.maxR / 3) || this.owner == 0) {
                this.r -= (dt / 1600) * (this.maxR / this.r);
                if(this.r <= 0)
                    this.remove = true;
            }
        }

        this.rate = Math.max(350, (2200 - (32 * this.r)) * (this.reserve / this.r));

        if(this.owner != 0) {
            if(this.particleReady(dt))
                this.reserve++;
        } else if(this.reserve < Math.floor(this.r / 2)) {
            if(this.particleReady(dt))
                this.reserve++;
        } else if(this.reserve > Math.floor(this.r / 2)) {
            this.reserve--;
        }
    },

    // Draw the planet
    draw: function(canvas)
    {
        canvas.fillStyle = this.color.toString();
        canvas.beginPath();
        canvas.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        canvas.closePath();
        canvas.fill();

        if(this.r > 8) {
            canvas.fillStyle = (new Color(255, 255, 255)).toString();
            canvas.font = '12px sans-serif';
            canvas.textBaseline = 'middle';
            canvas.textAlign = 'center';
            canvas.fillText(this.reserve, this.x, this.y);
        }
    }
}
