// Initialize the Thunder.js library
Th.init();

var Sound =
{
    sineFunc: function(si, len, frq, chn, opt)
    {
        var fad = (len - si) / len;
        // The sine function that produces the sound
        return Math.floor(fad * 128 * 256 * (
                    Math.sin(2.0 * Math.PI * frq * si / 44100)));
    },

    instSound: function(frq)
    {
        if(Th.Inst.get("InstSound") == null) {
            Th.Inst.create("InstSound", this.sineFunc);
        }

        // Play the sound
        Th.Inst.get("InstSound").getSound(frq).play();
    }
};
