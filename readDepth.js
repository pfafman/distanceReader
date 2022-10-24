#!/.....

const raspi  = require('raspi');
const Serial = require('raspi-serial').Serial;
const http   = require('http');

let data = [];
let i = 0;
let ave = 0;
let aveCnt = 0;

checkSum = (data) => {
    return (data[0] + data[1] + data[2]) & 0x00ff
}


postData = (data) => {

    var postData = JSON.stringify(data);

    var options = {
      hostname: 'zero.local',
      port: 3000,
      path: '/api/insertDepth/',
      method: 'POST',
      headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': postData.length
         }
    };

    var req = http.request(options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.write(postData);
    req.end();
}


raspi.init(() => {

    var serial = new Serial({portId: "/dev/serial0", baudRate: 9600});
    serial.open(() => {
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
                    let distance = data[1]*256 + data[2];
                    ave += distance;
                    aveCnt++;
                    if (aveCnt > 20) {
                        ave /= aveCnt;
                        console.log("Distance is", ave*0.0393701);
                        ave = 0;
                        aveCnt = 0;
                        postData({'depth': ave});
                    }
                }
                i = 0;
                data = [];

            }
        });
    });
});

