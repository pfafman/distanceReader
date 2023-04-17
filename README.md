#distanceReader


Read the distance on a raspberry pi from the A02YYUW is an waterproof ultrasoinic sensor.


[Link](https://wiki.dfrobot.com/_A02YYUW_Waterproof_Ultrasonic_Sensor_SKU_SEN0311)


###Put in crontab

```
@reboot sleep 10; /usr/bin/forever start -o /home/pi/depth.log -e /home/pi/depth.log /home/pi/distanceReader/readDepth.js
```
