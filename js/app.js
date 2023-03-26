/* global $SD */
$SD.on('connected', conn => connected(conn));

function connected(jsn) {
    debugLog('Connected Plugin:', jsn);

    const action = new Action;

    /** subscribe to the willAppear event */
    $SD.on('com.yakokino.natureremo.action1.willAppear', jsonObj =>
        action.onWillAppear(jsonObj)
    );
    $SD.on('com.yakokino.natureremo.action1.didReceiveSettings', jsonObj =>
        action.onDidReceiveSettings(jsonObj)
    );
    $SD.on('com.yakokino.natureremo.action1.willDisappear', jsonObj =>
        action.onWillDisappear(jsonObj)
    );
    $SD.on('com.yakokino.natureremo.action1.keyUp', jsonObj =>
        action.onKeyUp(jsonObj)
    );
}

class Action {

    constructor() {
        this.type = 'com.yakokino.natureremo.action1';
        this.cache = {};
    }

    onDidReceiveSettings(jsn) {
        console.log("onDidReceiveSettings", jsn);
        const settings = jsn.payload.settings;
        const clock = this.cache[jsn.context];
        if (!settings || !clock) return;

        if (settings?.clock_index) {
            this.cache[jsn.context] = clock;
        }
        if (settings?.clock_type) {
            clock.setClockType(settings.clock_type);
        }
    }

    onWillAppear(jsn) {

        if (!jsn?.payload?.settings) return;

        //console.log('onWillAppear', jsn.payload.settings);

        // cache the current clock
        this.cache[jsn.context] = new AnalogClock(jsn);
        this.onDidReceiveSettings(jsn);
    }

    onWillDisappear(jsn) {
        const found = this.cache[jsn.context];
        if (found) {
            // remove the clock from the cache
            found.destroyClock();
            delete this.cache[jsn.context];
        }
    }

    onKeyUp(jsn) {
        const clock = this.cache[jsn.context];
        /** Edge case +++ */
        if (!clock) this.onWillAppear(jsn);
        else clock.toggleClock();
    }

}

class AnalogClock {

    constructor(jsonObj) {
        this.jsn = jsonObj;
        this.context = jsonObj.context;
        this.clockTimer = 0;
        this.clock = null;
        this.origContext = jsonObj.context;
        this.canvas = null;
        this.demo = false;
        this.count = Math.floor(Math.random() * Math.floor(10));
        this.type = 'analog';

        this.createClock();
    }


    isDemo() {
        return this.demo;
    }

    createClock(settings) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 144;
        this.canvas.height = 144;
        this.clock = new Clock(this.canvas);
        this.clock.type = this.type;
        this.toggleClock();
    }

    toggleClock() {
        if (this.clockTimer === 0) {
            this.clockTimer = setInterval((sx) => {
                this.drawClock();
                this.count++;
            }, 1000);
        } else {
            window.clearInterval(this.clockTimer);
            this.clockTimer = 0;
        }
    }

    drawClock(jsn) {
        this.clock.drawClock();
        $SD.api.setTitle(this.context, new Date().toLocaleTimeString(), null);
        $SD.api.setImage(
            this.context,
            this.clock.getImageData()
        );
    }

    setClockType(type) {
        this.clock.type = type;
        this.drawClock();
    }

    getClockType() {
        this.clock.type;
    }

    destroyClock() {
        if (this.clockTimer !== 0) {
            window.clearInterval(clockTimer);
            this.clockTimer = 0;
        }
    }

}
