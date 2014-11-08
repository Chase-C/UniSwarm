// Initialize the Thunder.js library
Th.init();

var Sound =
{
    bloopFunc: function(si, len, frq, chn, opt)
    {
        var fad = (len - si) / len;
        // The sine function that produces the sound
        return 0.3 * Math.floor(fad * 128 * 256 * (
                    Math.sin(2.0 * Math.PI * frq * si / 44100)));
        //return Math.floor(fad * 128 * 256 * (
        //            Math.sin(2.0 * Math.PI * frq * si / 44100)));
    },

    playSound: function(frq, vol)
    {
        var sound = Th.Sound.get(frq.toString());
        if(!sound)
            sound = Th.Sound.create(frq.toString(), this.bloopFunc, {duration: .12, freq: frq});

        sound.play();
    }
};
