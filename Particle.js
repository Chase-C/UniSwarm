var Particle = function(x, y)
{
    // Position
    this.x = x || 0;
    this.y = y || 0;
    // Radius
    this.r = 2;

    // Velocity
    this.vx = 1;
    this.vy = 0;

    // Target position or object
    this.tp = null;
    this.owner = 1;
    // Is it selected by the player
    this.selected = false;
    // The state of the particle
    this.state = 0; // 0 = normal
                    // 1 = attack
                    // 2 = enter planet
    this.enteringPlanet = false;
    this.collided = false;
    this.removed = false;

    this.hits = 0;

    // Color
    this.color = (new Color(0, 0, 0)).Red();
}

Particle.prototype =
{
    // Getter and setter methods
    getX: function() { return this.x },
    setX: function(x) { this.x = x },
    
    getY: function() { return this.y },
    setY: function(y) { this.y = y },

    getRadius: function() { return this.r },

    getVelX: function() { return this.vx },
    setVelX: function(vx) { this.vx = vx },

    getVelY: function() { return this.vy },
    setVelY: function(vy) { this.vy = vy },

    getColor: function()
    {
        var color = new Color(0, 0, 0);
        color = color.add(this.color);
        return color;
    },

    // Get the position as a vector
    posVector: function()
    {
        return new Vector(this.x, this.y);
    },

    // Vector getter and setter methods
    velocityVector: function()
    {
        return new Vector(this.vx, this.vy);
    },

    setVel: function(vector)
    {
        this.setVelX(vector.getX());
        this.setVelY(vector.getY());
    },

    // Set the particle's target position
    setTarget: function(target)
    {
        this.tp = target;
    },

    dist: function(other)
    {
        var dx = this.x - other.x;
        var dy = this.y - other.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    },

    // Called every frame to update the particle's position
    updateSteering: function(neighbors)
    {
        var vel = this.velocityVector();
        var target = new Vector(0, 0);
        var seek = new Vector(0, 0);
        var avoid = new Vector(0, 0);
        var avoidIndex = -1;

        var state = this.state; // State 0 = normal
        var noAttack = true;

        // Using an 'i' in this loop will crash your browser (Firefox or Chrome)
        // Thanks javascript, it only took 4 hours to figure out
        for(j = 0; j < neighbors.length; j++) {
            if(neighbors[j] != this) {
                if(neighbors[j].hashR != undefined) {
                    avoidIndex = j;
                } else {
                    var dv = neighbors[j].posVector().subtract(this.posVector()).scale(0.16);
                    var length = dv.getLength();
                    if(length != 0) {
                        if(neighbors[j].owner == this.owner) { // Friend
                            var offset = dv.copy().scale(3.5 / length);
                            if(length > 4) dv = offset.copy().scale(2);
                            dv.subtract(offset);

                            seek.add(dv);
                        } else { // Enemy
                            state = 1; // State 1 = attacking
                            noAttack = false;
                            seek.add(dv);
                        }
                    } else {
                        console.log('error, bitch');
                    }
                }
            }
        }

        if(noAttack && state == 1)
            state = 0;

        var steering = new Vector(0, 0);

        if(this.tp != null) {
            var targetPos = new Vector(this.tp.x, this.tp.y);
            if(state == 1)
                var target = targetPos.subtract(this.posVector()).normalize().scale(0.5);
            else
                var target = targetPos.subtract(this.posVector()).normalize().scale(2);

            steering.add(target.subtract(vel)).normalize().scale(1.5);
        }
        steering.add(seek);

        if(avoidIndex >= 0) {
            // If we want to enter the planet, don't try to avoid it
            if(neighbors[avoidIndex] == this.tp && (state == 2 || this.tp.owner == this.owner)) {
                this.enteringPlanet = true;
            } else {
                var dv = this.posVector().add(this.velocityVector().scale(2)).subtract(neighbors[avoidIndex].posVector());
                var length = dv.getLength();
                var diff = Math.max(0.2, length - (this.r + neighbors[avoidIndex].r));
                avoid = dv.scale(4 / (length * diff));

                steering.add(avoid);
            }
        }

        this.state = state;
        this.setVel(vel.add(steering.normalize()).normalize().scale(2));
    },

    update: function()
    {
        if(this.tp.remove)
            this.tp = new Vector(this.tp.x, this.tp.y);

        if(this.tp.owner == this.owner)
            this.state = 2;

        this.x += this.vx;
        this.y += this.vy;
    },

    release: function(vel)
    {
        this.setVel(vel);
    },

    // Draw the particle
    draw: function(canvas)
    {
        canvas.fillStyle = this.color.toString();
        canvas.beginPath();
        canvas.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
        canvas.closePath();
        canvas.fill();
    }
}
