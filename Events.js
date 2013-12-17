document.onmousedown = function(evt)
{
    evt = evt || event;
    engine.mouseDown(evt);
}

document.onmouseup = function(evt)
{
    evt = evt || event;
    engine.mouseUp(evt);
}

document.addEventListener('keydown', function(event) {
     switch(event.keyCode) {
        case 80:
            if(engine.running == true) {
                engine.running = false;
            } else {
                engine.running = true;
                Run();
            }
            break;
        case 69:
            engine.toggleBgEffect();
            break;
        case 82:
            engine.reset();
            break;
        case 83:
            engine.toggleSound();
            break;
    }
});

document.addEventListener('mousemove', function(event) {
    engine.setMousePos(event);
    if(engine.isRunning()) {
        engine.drawMouse(context);
    } else {
        engine.draw(context);
    }
});

document.oncontextmenu = function(evt) { stopEvent(evt); }

function stopEvent(event){
    if(event.preventDefault != undefined)
        event.preventDefault();
    if(event.stopPropagation != undefined)
        event.stopPropagation();
}
