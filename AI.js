var Group = function()
{
    this.particles = [];
    this.target = null;
    this.x;
    this.y;
}

Group.prototype =
{
    checkRemoved: function()
    {
        for(j = 0; j < this.particles.length; j++) {
            if(this.particles[j].removed) {
                this.particles[j] = this.particles[this.particles.length - 1];
                this.particles.pop();
                j--;
            }
        }
    },

    updatePos: function()
    {
        var x = 0;
        var y = 0;
        for(j = 0; j < this.particles.length; j++) {
            x += this.particles[j].x;
            y += this.particles[j].y;
        }
        this.x = x / this.particles.length;
        this.y = y / this.particles.length;
    },

    updateTarget: function()
    {
        for(j = 0; j < this.particles.length; j++) {
            if(this.target)
                this.particles[j].tp = this.target;
        }
    }
}

var AI = function(planet)
{
    this.homePlanet = planet;
    this.homeGroup = null;

    this.groups = [];
    this.currGroup = null;

    this.totalParticles = 0;
    this.freeParticles = 0;
    this.wantParticle = false;
}

AI.prototype =
{
    dist: function(a, b)
    {
        var x = a.x - b.x;
        var y = a.y - b.y;
        return Math.sqrt((x * x) + (y * y));
    },

    addToCurrentGroup: function(particle)
    {
        particle.color = (new Color(0, 0, 0)).Blue();
        if(this.currGroup)
            this.currGroup.particles.push(particle);
    },

    update: function(planets, playerPlanet)
    {
        this.totalParticles = 0;
        this.freeParticles = 0;

        // Update groups
        for(i = 0; i < this.groups.length; i++) {
            var group = this.groups[i];
            group.checkRemoved();

            this.freeParticles += group.particles.length;
            if(group.particles.length <= 0) {
                this.groups[i] = this.groups[this.groups.length - 1];
                this.groups.pop();
                i--;
            } else if(!group.target || (!group.target.growing && (group.target.r < group.target.maxR / 2))) {
                if(group.target)
                    group.target.p2Circling -= group.particles.length;

                group.target = this.chooseNewPlanet(group, planets, playerPlanet);
                if(group.target) {
                    group.target.p2Circling += group.particles.length;
                    group.updateTarget();
                }
            }
        }

        this.totalParticles = this.freeParticles

        if(this.homePlanet) {
            this.totalParticles += this.homePlanet.reserve;
            // Jump ship
            if(!this.homePlanet.growing && (this.homePlanet.r < this.homePlanet.maxR * 0.75)) {
                this.wantParticle = true;
            } else {
                // Check if we should release some particles
                if(!this.wantParticle && (this.homePlanet.reserve > Math.max(10, (this.homePlanet.r * 0.5) * 1.5))) {
                    this.wantParticle = true;
                    this.currGroup = new Group();
                } else if(this.wantParticle && (this.homePlanet.reserve < Math.max(2, this.homePlanet.r / 3))) {
                    this.wantParticle = false;
                    if(this.currGroup) {
                        this.homePlanet.p2Circling -= this.currGroup.particles.length;
                        this.groups.push(this.currGroup);
                        this.currGroup = null;
                    }
                }
            }
        // Check if we need to find a new home planet
        } else {
            this.wantParticle = false;
            if(this.currGroup) {
                this.groups.push(this.currGroup);
                this.currGroup = null;
            }

            if(!this.homePlanet && !this.homeGroup)
                this.chooseHomePlanet(planets);
            // Check if we aren't able to cap our chosen home planet
            else if(this.homeGroup) {
                if((this.homeGroup.particles.length * 1.3 < this.homeGroup.target.reserve)
                        || (this.homeGroup.particles.length <= 0))
                    this.homeGroup = null;
            }
        }
    },

    chooseNewPlanet: function(group, planets, playerPlanet)
    {
        var planet = null;
        var fitness = 99999;
        group.updatePos();

        for(j = 0; j < planets.length; j++) {
            if(planets[j] != this.homePlanet) {
                var newFit = this.dist(group, planets[j]) - (0.5 * planets[j].r)
                    + (10 * (planets[j].p2Circling - planets[j].p1Circling));

                if(planets[j].growing) newFit -= 250;
                if(playerPlanet) {
                    newFit -= (0.5 * (200 - this.dist(planets[j], playerPlanet)));
                    if(planets[j] == playerPlanet)
                        newFit -= 10 * (group.particles.length - playerPlanet.reserve);
                }

                if(newFit < fitness) {
                    planet = planets[j];
                    fitness = newFit;
                }
            }
        }
        return planet;
    },

    chooseHomePlanet: function(planets)
    {
        var group;
        var planet;
        var fitness = 99999;
        for(i = 0; i < this.groups.length; i++) {
            this.groups[i].updatePos();
            for(j = 0; j < planets.length; j++) {
                if(this.groups[i].particles.length > planets[j].reserve * 1.5) {
                    var newFit = this.dist(this.groups[i], planets[j]) - planets[j].r
                                 + (10 * (planets[j].p2Circling - planets[j].p1Circling));
                    if(planets[j].growing) newFit -= 150;

                    if(newFit < fitness) {
                        group = this.groups[i];
                        planet = planets[j];
                        fitness = newFit;
                    }
                }
            }
        }

        if(planet) {
            for(i = 0; i < group.particles.length; i++) {
                group.particles[i].state = 0;
                group.particles[i].tp = planet;
            }
            this.homeGroup = group;
            this.homeGroup.target = planet;
            planet.p2Circling += group.particles.length;

            this.homeGroup.updateTarget();
        }
    }
}
