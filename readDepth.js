#!/.....

const raspi  = require('raspi');
const Serial = require('raspi-serial').Serial;
const http   = require('http');
const gpio = require('onoff').Gpio;

let i = 0;
let data = [];
let ave = 0;
let ave2 = 0;
let aveCnt = 0;
let minValue = 100;
let maxValue = 0;

const power = new gpio(23, 'out');

console.log("Turn on Power Line GPIO 23");
power.writeSync(1);

checkSum = (data) => {
    return (data[0] + data[1] + data[2]) & 0x00ff
}


resetData = () => {
    console.log("resetData");
    ave = 0;
    aveCnt = 0;
    minValue = 100;
    maxValue = 0;
}



postData = (data) => {

    var postData = JSON.stringify(data);

    var options = {
      hostname: 'kyotehut.lan',
      port: 4000,
      path: '/api/insertDepth/',
      method: 'POST',
      headers: {
           'Content-Type': 'application/json',
           'Content-Length': postData.length
         }
    };

    var req = http.request(options, (res) => {
      console.log('postdata statusCode:', res.statusCode);
      // console.log("");

      res.on('data', (d) => {
        //console.log(`BODY: ${d}`);
      });

      res.on('end', () => {
        //console.log('No more data in response.');
      });

    });

    req.on('error', (e) => {
	   console.error("postData",e);
    });

    console.log("postData", data);
    req.write(postData,'utf8');
    req.end();
}


raspi.init(() => {

    console.log("Raspi Init: new Serial");

    var serial = new Serial({portId: "/dev/serial0", baudRate: 9600});
    
    console.log("Raspi Init: new Serial Created");

    serial.open(() => {
        console.log("Serial opened ...");
        
        serial.on('data', async (byte) => {
            i++;
            data.push(byte[0])
            //console.log("Data:[", byte.length, ']:',i, ':', byte[0]);

            if (data[0] != 255) {
                i = 0;
                data = [];
            }
            if (i == 4) {
                let sum = checkSum(data);
                if (sum != data[3]) {
                    console.log("Checksum Error", sum, data);
                } else {
                    let distance = 0.0393701 * (data[1]*256 + data[2]);
		            //console.log("Distance", distance);
                    if ((distance < 0) || (distance > 70)) {
                        console.log("Bad Value", distance);
                    } else {
                        ave += distance;
                        aveCnt++;
                        if (minValue > distance) {
                            minValue = distance;
                        }
                        if (maxValue < distance) {
                            maxValue = distance;
                        }
                        if (aveCnt > 100) {
                            ave /= aveCnt;
                            if ( ((maxValue - ave) > 1) || ((ave - minValue) > 1) ) {
                                console.log("Noisy", ave.toFixed(3), minValue.toFixed(3), maxValue.toFixed(3));
                                resetData();
                            } else {
                                console.log("");
                                console.log("Post distance: (", aveCnt, ") ", ave.toFixed(3), minValue.toFixed(3), maxValue.toFixed(3));
                                postData({'depth': ave});
                                resetData();
                            }
                        }
                    }
                }
                i = 0;
                data = [];
            }
        });
    });
});

