/*
    Team7 dos tester | Update: 2021/06/06
*/

var dire = 'http://localhost:8080/main/login';
var per_sec = 1000;
var cnt = 0;
var flag = true;

function st() {
    cnt++;
    var req = new XMLHttpRequest();
    req.onreadystatechange = function () {
        if (req.readyState == 4) {
            if (req.status == 200) {
            }
        }
    }
    req.open('GET', dire, true);
    req.send('test');
}
function pr () {
    console.log(cnt+' / s');
    cnt = 0;
}

function bb() {
    if (flag) {
        flag = false;
        setInterval(st, 1000/per_sec);
        setInterval(pr, 1000);
        console.log('start');
    }
}
