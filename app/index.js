import { HeartRateSensor } from "heart-rate";
import { Accelerometer } from "accelerometer";
import { Barometer } from "barometer";
import * as messaging from "messaging";
import clock from "clock";
import { FitFont } from "fitfont";
import { battery } from "power";
import { vibration } from "haptics";

clock.granularity = "minutes"; 

messaging.peerSocket.addEventListener("error", (err) => {
  console.error(`Connection error: ${err.code} - ${err.message}`);
});

const DayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const dayLabel  = new FitFont({ id:'dayLabel',  font:'DynaPuff_24',  halign: 'middle'});
const dateLabel = new FitFont({ id:'dateLabel', font:'DynaPuff_40', halign: 'middle'});
const timeLabel  = new FitFont({ id:'timeLabel',  font:'DynaPuff_96',  halign: 'middle'});
const hrLabel = new FitFont({ id:'hrLabel', font:'DynaPuff_40', halign: 'middle'});
const batteryLabel = new FitFont({ id:'batteryLabel', font:'DynaPuff_18', halign: 'middle'});

const dateToYMD = (date) => {
    var strArray=['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var d = date.getDate();
    var m = strArray[date.getMonth()];
    var y = date.getFullYear();
    return (d <= 9 ? '0' + d : d) + ' ' + m + ' ' + y;
}


const updateClock = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    timeLabel.text = ('0'+hours).slice(-2) + ':' + ('0'+minutes).slice(-2);
    dayLabel.text  = DayNames[now.getDay()];
    dateLabel.text = dateToYMD(now);
}

const updateBattery = () => {
    batteryLabel.text = Math.floor(battery.chargeLevel) + "%";
}

let counthr = 0;
let ratehr = 0;
let countacc = 0;
let rateacc = [0,0,0];
let countbar = 0;
let ratebar = 0;
let hr = -999;
let acc = [0,0,0];
let bar = 0;
let countv = 0
const updateHeartRate = () => {
    const hrate = hrm.heartRate;
    if(hrate !== null && hrate > 20 && hrate < 240) {
        counthr += 1;
        ratehr += hrate;
        hrLabel.text = '♥ '+hrate;
        if (counthr === 15) {
            ratehr = Math.round(ratehr/15);
            hr = ratehr;
            if((hr > 110 || hr < 50) && countv == 0) {
                vibration.start("alert");
                setTimeout(() => {  vibration.stop(); }, 3000);
                countv += 1;
            } else if(hr > 110 || hr < 50) {
                countv += 1;
                if (countv == 19) {
                    countv = 0
                }
            } else if (hr <= 110 && hr >= 50) {
                countv = 0
            }
            counthr = 0;
            ratehr = 0;
        }
    } else {
        hr = -999;
    }
}

const updateAccelerometer = () => {
    countacc += 1;
    rateacc[0] += accelerometer.x;
    rateacc[1] += accelerometer.y;
    rateacc[2] += accelerometer.z;
    if (countacc === 15) {
        rateacc[0] = Math.round((rateacc[0]/15)*1000000)/1000000;
        rateacc[1] = Math.round((rateacc[1]/15)*1000000)/1000000;
        rateacc[2] = Math.round((rateacc[2]/15)*1000000)/1000000;
        acc[0] = rateacc[0];
        acc[1] = rateacc[1];
        acc[2] = rateacc[2];
        countacc = 0;
        rateacc = [0,0,0];
    }
}

const updateBarometer = () => {
    countbar += 1;
    ratebar += barometer.pressure;
    if (countbar === 15) {
        ratebar = Math.round(ratebar/15000);
        bar = ratebar;
        countbar = 0;
        ratebar = 0;
    }
}

const updateData = () => {
    if(messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        messaging.peerSocket.send({
            command: hr+'|'+acc[0]+','+acc[1]+','+acc[2]+'|'+bar
        });
    }
}

const hrm = new HeartRateSensor({ frequency: 1 });
const accelerometer = new Accelerometer({ frequency: 1 });
const barometer = new Barometer({ frequency: 1 });

hrm.onreading = (evt) => updateHeartRate();
accelerometer.onreading = (evt) => updateAccelerometer();
barometer.onreading = (evt) => updateBarometer();

clock.ontick = (evt) => updateClock();
battery.onchange = (evt) => updateBattery();
hrm.start();
accelerometer.start();
barometer.start();

updateClock();
updateBattery();
updateHeartRate();
updateAccelerometer();
updateBarometer();

setInterval(updateData, 15000)