var Vector = function(x, y)
{
    this.x = x || 0;
    this.y = y || 0;

    // Getters and setters
    this.getX = function() { return this.x }
    this.setX = function(x) { this.x = x }

    this.getY = function() { return this.y }
    this.setY = function(y) { this.y = y }

    // Return a copy of the vector
    this.copy = function()
    {
        return new Vector(this.x, this.y);
    }

    // Dot product
    this.dot = function(vector)
    {
        return (this.x * vector.x) + (this.y * vector.y);
    }

    // Get the length of the vector
    this.getLength = function()
    {
        return Math.sqrt((this.x*this.x) + (this.y*this.y));
    }

    // Scale vector
    this.scale = function(scale)
    {
        this.x *= scale;
        this.y *= scale;
        return this;
    }

    // Normalize vector
    this.normalize = function()
    {
        var length = this.getLength();
        this.x = this.x / length;
        this.y = this.y / length;
        return this;
    }

    // Add and subtract functions
    this.add = function(vector)
    {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    this.subtract = function(vector)
    {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
}
