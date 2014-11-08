var Engine = function(w, h)
{
    this.w = w || 0;
    this.h = h || 0;

    this.hash = new SpatialHash(w, h, 8);

    this.planets = [];
    // Seed the map with some random planets
    for(i = 0; i < 16; i++)
        this.addPlanet(false);

    this.player1Planet = this.planets[Math.floor(Math.random() * this.planets.length)];
    this.player1Planet.setPlayer1Planet();

    this.player2Planet = this.planets[Math.floor(Math.random() * this.planets.length)];
    while(this.player1Planet == this.player2Planet)
        this.player2Planet = this.planets[Math.floor(Math.random() * this.planets.length)];
    this.player2Planet.setPlayer2Planet();

    this.player1Planet.reserve = 25;
    this.player2Planet.reserve = 25;

    this.ai = new AI(this.player2Planet);

    this.particles = [];

    this.fillFreq = 250;
    this.releaseFreq = 250;
    this.focusPlanet = null;

    this.updateMask = false;
    this.running = true;
    this.time = Date.now();

    this.mx = 0;
    this.my = 0;
    this.mr = 30;
    this.lmouseButton = false;
    this.rmouseButton = false;

    this.winner = 0;
}

Engine.prototype =
{
    // Update the simulation each frame
    update: function()
    {
        if(this.winner > 0)
            return;

        var currTime = Date.now();
        var dt = currTime - this.time;

        this.updateMask = !this.updateMask;

        // Update the enemy AI
        this.ai.update(this.planets, this.player1Planet);
        // Does the AI want to release particles?
        if(this.ai.wantParticle) {
            if(this.player2Planet != null && this.player2Planet.releaseReady(dt)) {
                var particle = this.addParticleFromPlanet(this.player2Planet);
                this.ai.addToCurrentGroup(particle);
            }
        }

        // See if we are releasing particles from a planet
        if(this.lmouseButton && this.player1Planet != null && this.focusPlanet == this.player1Planet) {
            if(this.player1Planet.releaseReady(dt)) {
                this.addParticleFromPlanet(this.player1Planet);
                //Sound.playSound(this.releaseFreq, 50);
                //this.releaseFreq += 16;
            }
        }

        if(this.releaseFreq > 250)
            this.releaseFreq -= 1;

        // Update each planet
        for(i = 0; i < this.planets.length; i++) {
            this.planets[i].update(dt);
            if(this.planets[i].remove) {
                this.planets[i] = this.planets[this.planets.length - 1];
                this.planets.pop();
                this.addPlanet(true);
            }
        }

        if(this.player1Planet && this.player1Planet.remove) {
            // This shouldn't actually be called ever
            // It's also broken
            this.removePlayerPlanet(this.player1Planet);
        }

        var playerUnits = 0;
        var aiUnits = 0;
        // Update each particle
        for(i = 0; i < this.particles.length; i++) {
            if(this.particles[i].owner == 1)
                playerUnits++;
            else
                aiUnits++;

            if(this.updateMask ^ (i & 1) || this.particles[i].state == 1) { // State 1 = attacking
                var neighbors = this.hash.wideSearch(this.particles[i]);
                // Check collisions with enemy particles
                if(this.particles[i].state == 1) {
                    for(j = 0; j < neighbors.length; j++) {
                        if((this.particles[i].owner != neighbors[j].owner) && !neighbors[j].hashR) {
                            if(!neighbors[j].collided) {
                                // If they collide, increment the hit counter
                                if(this.checkCollision(this.particles[i], neighbors[j])) {
                                    this.particles[i].hits++;
                                    neighbors.hits++;
                                }
                            }
                        }
                    }
                    this.particles[i].collided = true;
                }
                this.particles[i].updateSteering(neighbors);
            }

            if(this.particles[i].hits >= 3) {
                this.particles[i].removed = true;
                this.particles[i] = this.particles[this.particles.length - 1];
                this.particles.pop();
            } else {
                this.particles[i].update();

                if(this.particles[i].tp.hashR != undefined) {
                    this.particles[i].state = 2;
                }
                // Check if this particle wants to enter a planet
                if(this.particles[i].enteringPlanet) {
                    // Check if this particle already has a planet
                    if(((this.particles[i].owner == 1 && this.player1Planet)
                       || (this.particles[i].owner == 2 && this.player2Planet))
                       // Is it entering its own planet?
                       && (this.particles[i].tp.owner == 0)) {
                        this.particles[i].tp = new Vector(this.particles[i].tp.x, this.particles[i].tp.y);
                        this.particles[i].enteringPlanet = false;
                        // No home planet, so the particle can enter anything
                    } else {
                        var planet = this.particles[i].tp;
                        // Is it colliding with a planet?
                        if(this.checkCollision(this.particles[i], planet)) {
                            if(this.particles[i].owner == 1)
                                planet.p1Circling--;
                            else
                                planet.p2Circling--;

                            // Add units to your home planet
                            if(this.particles[i].owner == planet.owner) {
                                planet.reserve++;
                            // Remove untis from enemy or neutral planet
                            } else {
                                planet.reserve--;
                                if(planet.reserve < 0) {
                                    planet.unsetPlayerPlanet();
                                    if(this.particles[i].owner == 1) {
                                        if(planet == this.player2Planet) {
                                            this.player2Planet = null;
                                            this.ai.homePlanet = null;
                                        }
                                        if(!this.player1Planet) {
                                            this.player1Planet = planet;
                                            planet.setPlayer1Planet();
                                        }
                                    } else {
                                        if(planet == this.player1Planet)
                                            this.player1Planet = null;
                                        if(!this.player2Planet) {
                                            this.player2Planet = planet;
                                            planet.setPlayer2Planet();
                                            this.ai.homePlanet = planet;
                                        }
                                    }
                                    planet.reserve = 0;
                                }
                            }

                            this.particles[i].removed = true;
                            this.particles[i] = this.particles[this.particles.length - 1];
                            this.particles.pop();
                        }
                    }
                }
            }
        }

        // Check for mouse button presses
        if(this.lmouseButton || this.rmouseButton) {
            for(i = 0; i < this.particles.length; i++) {
                if(!this.particles[i].selected && this.particles[i].owner == 1) {
                    if(this.checkMouseCollision(this.particles[i])) {
                        this.particles[i].selected = true;
                        this.selected++;
                    }
                }
                if(!this.lmouseButton && this.particles[i].selected) {
                    var target;
                    if(this.focusPlanet) {
                        if(this.player1Planet == null || this.focusPlanet.owner != 0)
                            target = this.focusPlanet;
                        else
                            target = new Vector(this.focusPlanet.x, this.focusPlanet.y);
                    }
                    else target = new Vector(this.mx, this.my);

                    if(target != this.particles[i].target) {
                        this.particles[i].state = 0;
                        if(this.particles[i].target && this.particles[i].target.p1Circling)
                            this.particles[i].target.p1Circling--;

                        if(target.p1Circling)
                            target.p1Circling++;

                        this.particles[i].setTarget(target);
                    }
                }
            }
        }

        if(this.player1Planet)
            playerUnits += this.player1Planet.reserve;
        if(this.player2Planet)
            aiUnits += this.player2Planet.reserve;

        if(aiUnits == 0)
            this.winner = 1;
        else if(playerUnits == 0)
            this.winner = 2;

        // Update the spatial hash
        this.hash.update();

        this.time = currTime;
    },

    // Reset the simulation
    reset: function()
    {
        this.planets = [];
        this.particles = [];
        if(this.running == false) {
            this.running = true;
            Run();
        }
    },

    // Add a particle to the array
    addParticle: function(x, y)
    {
        var particle = new Particle(x, y);
        this.particles.push(particle);
    },

    addParticleFromPlanet: function(planet)
    {
        var pos = planet.getRandSurfacePoint();
        var particle = new Particle(pos.x, pos.y);
        var vel = pos.subtract(new Vector(planet.getX(), planet.getY())).normalize().scale(2);
        particle.setVel(vel);

        var tx = planet.getX() + (Math.random() * 8) - 4;
        var ty = planet.getY() + (Math.random() * 8) - 4;
        particle.setTarget(new Vector(tx, ty));

        particle.owner = planet.owner;

        this.particles.push(particle);
        this.hash.insert(particle);

        planet.reserve--;
        if(planet.reserve <= 0) {
            if(planet.owner == 1)
                this.player1Planet = null;
            if(planet.owner == 2) {
                this.player2Planet = null;
                this.ai.homePlanet = null;
            }

            planet.unsetPlayerPlanet();
            planet.reserve = 0;
        }

        if(planet.owner == 1) {
            particle.selected = true;
            //planet.p1Circling++;
        } else if(planet.owner == 2)
            planet.p2Circling++;

        return particle;
    },

    addPlanet: function(zero)
    {
        var r = (Math.random() * 24) + 16;
        var extr = r + 16;
        var x = Math.random() * (this.w - (2 * extr)) + extr;
        var y = Math.random() * (this.h - (2 * extr)) + extr;
        for(j = 0; j < this.planets.length; j++) {
            var dx = this.planets[j].getX() - x;
            var dy = this.planets[j].getY() - y;
            var dr = this.planets[j].maxRadius() + r;
            if((dx * dx) + (dy * dy) < 3 * (dr * dr)) {
                x = Math.random() * (this.w - (2 * extr)) + extr;
                y = Math.random() * (this.h - (2 * extr)) + extr;
                j = 0;
            }
        }
        var planet = new Planet(x, y, r, zero);
        this.planets.push(planet);
        this.hash.insertCircle(planet);
    },

    removePlayerPlanet: function(planet)
    {
        for(i = 0; i < this.planet.reserve; i++) {
            var x = this.planet.getX() + (Math.random() * 16) - 8;
            var y = this.planet.getY() + (Math.random() * 16) - 8;

            var particle = new Particle(x, y);
            particle.setTarget(new Vector(this.planet.x, this.planet.y));
            particle.selected = true;
            particle.owner = planet.owner;

            this.particles.push(particle);
            this.hash.insert(particle);
        }
        this.planet = null;
    },

    // Check for a collision between two particles
    checkCollision: function(p1, p2)
    {
        if(p1 == p2)
            return;

        var xDist = p1.x - p2.x;
        var yDist = p1.y - p2.y;

        var totalRadius = p1.r + p2.r;

        // Circle on circle distance check
        if((xDist * xDist) + (yDist * yDist) <= totalRadius * totalRadius) {
            return true;
        }

        return false;
    },

    checkMouseCollision: function(p)
    {
        var tmp = new Object;
        if(this.focusPlanet) {
            tmp.x = this.focusPlanet.x;
            tmp.y = this.focusPlanet.y;
            tmp.r = this.focusPlanet.r + 12;
        } else {
            tmp.x = this.mx;
            tmp.y = this.my;
            tmp.r = this.mr;
        }

        return this.checkCollision(p, tmp);
    },

    setMousePos: function(evt)
    {
        this.mx = evt.pageX;
        this.my = evt.pageY;
    },

    // These functions are called when the mouse buttons are used
    mouseDown: function(evt) 
    {
        if(evt.button == 0) {
            // The left mouse button was pressed
            if(this.lmouseButton) return;
            this.lmouseButton = true;

            this.selected = 0;
            for(i = 0; i < this.particles.length; i++) {
                this.particles[i].selected = false;
            }
        } else if(evt.button == 1 || evt.button == 2) {
            this.rmouseButton = true;
        }
    },

    mouseUp: function(evt)
    {
        if(evt.button == 0) {
            this.lmouseButton = false;
        } else if(evt.button == 1 || evt.button == 2) {
            this.rmouseButton = false;
        }
    },

    // Functions for starting and stopping the simulation
    start: function() { this.running = true },
    pause: function() { this.running = false },
    // Returns running
    isRunning: function() { return this.running },

    draw: function(canvas)
    {
        canvas.clearRect(0, 0, this.w, this.h);

        for(i = 0; i < this.planets.length; i++) {
            this.planets[i].draw(canvas);
        }
        for(i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(canvas);
        }

        //this.drawHash(canvas);
        this.drawMouse(canvas);
        if(this.winner > 0) {
            canvas.fillStyle = (new Color(128, 128, 128)).toString();
            canvas.font = '48px sans-serif';
            canvas.textBaseline = 'middle';
            canvas.textAlign = 'center';
            if(this.winner == 1)
                canvas.fillText('You Win!', this.w / 2, this.h / 2);
            else
                canvas.fillText('You Lose! :(', this.w / 2, this.h / 2);
        }
    },

    // Draw the mouse circle thing
    drawMouse: function(canvas)
    {
        if(!this.lmouseButton && !this.rmouseButton) {
            this.focusPlanet = null;
            for(i = 0; i < this.planets.length; i++) {
                var tmp = new Object();
                tmp.x = this.mx;
                tmp.y = this.my;
                tmp.r = 8;
                if(this.checkCollision(this.planets[i], tmp)) {
                    this.focusPlanet = this.planets[i];
                    break;
                }
            }
        }

        canvas.strokeStyle = 'rgb(168, 168, 168)';
        canvas.lineWidth = 4;

        if(this.focusPlanet != null) {
            if(this.focusPlanet == this.player1Planet) canvas.strokeStyle = (new Color(0, 0, 0)).Red().toString();
            else if(this.focusPlanet == this.player2Planet) canvas.strokeStyle = (new Color(0, 0, 0)).Blue().toString();
            canvas.beginPath();
            canvas.arc(this.focusPlanet.x, this.focusPlanet.y, this.focusPlanet.r + 1, Math.PI * 2, 0, true);
        } else {
            canvas.beginPath();
            canvas.arc(this.mx, this.my, this.mr, Math.PI * 2, 0, true);
        }
        canvas.closePath();
        canvas.stroke();
    },

    drawHash: function(canvas)
    {
        for(i = 0; i < this.hash.cw; i++) {
            for(j = 0; j < this.hash.ch; j++) {
                if(this.hash.array[i][j].length > 0) {
                    canvas.fillStyle = 'rgb(255, 168, 32)';
                    canvas.beginPath();
                    canvas.arc((i + .5) * this.hash.cellSize, (j + .5) * this.hash.cellSize,
                               this.hash.cellSize / 2, Math.PI * 2, 0, true);
                    canvas.closePath();
                    canvas.fill();
                }
            }
        }
    }
}
