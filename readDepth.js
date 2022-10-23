#!/.....

const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;

let data = [];
let i = 0;
let ave = 0;
let aveCnt = 0;

checkSum = (data) => {
    return (data[0] + data[1] + data[2]) & 0x00ff
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
                    if (aveCnt > 10) {
                        ave /= aveCnt;
                        console.log("Distance is", ave*0.0393701, '"');
                        ave = 0;
                        aveCnt = 0;
                    }
                }
                i = 0;
                data = [];

            }
        });
    });
});

