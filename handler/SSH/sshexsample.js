const sshcomand = require("./handler/SSH/handler.js");

var command = '/sbin/ifconfig';
var host = '52.225.179.74';
var user = "automation";
var privatekey = 'SSH/key2.pem';
var srcfile = "/projects/azure_auto/ssh/playground/test30m";
var dstfile = "/home/automation/test30m";
var res = sshcomand.ssh((err, data) => {
        if (err) return console.log(err);
        else {
            console.log("in cmd callback " + data);
        }
    },
    command, user, host, null, privatekey
);

sshcomand.scp((err, data) => {
        if (err) return console.log(err);
        else {
            console.log("in scp callback " + data);
        }

    },
    srcfile, dstfile,
    user, host, null, privatekey
);