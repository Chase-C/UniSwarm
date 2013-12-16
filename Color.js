var Color = function(r, g, b)
{
    this.r = r;
    this.g = g;
    this.b = b;

    this.clip();
}

Color.prototype =
{
    // Getters and setters
    getR: function() { return this.r },
    setR: function(r)
    {
        this.r = r;
        this.clip();
    },

    getG: function() { return this.g },
    setG: function(g)
    {
        this.g = g;
        this.clip();
    },

    getB: function() { return this.b },
    setB: function(b)
    {
        this.b = b;
        this.clip();
    },

    // Static colors
    Red: function()
    {
        return new Color(255, 32, 32);
    },

    Pink: function()
    {
        return new Color(232, 64, 116);
    },

    Yellow: function()
    {
        return new Color(224, 224, 0);
    },

    Green: function()
    {
        return new Color(32, 224, 32);
    },

    Cyan: function()
    {
        return new Color(0, 216, 255);
    },

    Blue: function()
    {
        return new Color(64, 128, 224);
    },

    // Check if this color matches the given rgb values
    matchRGB: function(r, g, b)
    {
        return ((this.r == r) && (this.g == g) && (this.b == b));
    },

    // Add two colors together, rgb values can't exceed 255
    add: function(color)
    {
        this.r += color.getR();
        this.g += color.getG();
        this.b += color.getB();

        this.clip();

        return this;
    },

    // Add given rgb values to this color
    addRGB: function(r, g, b)
    {
        this.r += r;
        this.g += g;
        this.b += b;

        this.clip();

        return this;
    },

    // Scale color as a percentage
    scale: function(p)
    {
        var frac = p / 100;
        this.r *= frac;
        this.g *= frac;
        this.b *= frac;

        this.clip();
    },

    // Mix two colors together taking a percentage of each
    mix: function(color, p)
    {
        if(p > 100)
            p = 100;
        else if(p < 0)
            p = 0;

        this.scale(100 - p);
        color.scale(p);
        
        color = this.add(color);
        this.clip();

        return this;
    },

    // Keep the rgb values within 0 - 255
    clip: function()
    {
        if(this.r > 255) this.r = 255;
        else if(this.r < 0) this.r = 0;
        else this.r = Math.round(this.r);

        if(this.g > 255) this.g = 255;
        else if(this.g < 0) this.g = 0;
        else this.g = Math.round(this.g);

        if(this.b > 255) this.b = 255;
        else if(this.b < 0) this.b = 0;
        else this.b = Math.round(this.b);
    },

    // Return the color as a string in the form "rgb(r,g,b)"
    toString: function()
    {
        var rgb = "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        return rgb;
    }
}
