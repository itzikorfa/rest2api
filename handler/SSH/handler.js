const Client = require('ssh2').Client;
const stat = require('../../infra/status.js');

var get_connection = (username, host, password = null, privatekey = null, port = 22) => {
    if (privatekey) {
        return {
            host: host,
            port: port,
            username: username,
            privateKey: Buffer.from(privatekey, 'base64').toString('utf8')
        };
    } else if (password) {
        return {
            host: host,
            port: port,
            username: username,
            password: password
        };
    }
}

function sshcommand(callback, command, username, host, password = null, privatekey = null, port = 22) {
    var conn = new Client();
    conn.on('ready', function () {
        console.log('Client :: ready');
        conn.exec(command, function (err, stream) {
            if (err) throw err;
            stream.on('close', function (code, signal) {
                console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                conn.end();
            }).on('data', function (data) {
                console.log('STDOUT: ' + data);
                callback(undefined, {
                    command,
                    host,
                    STDOUT: data.toString('utf8'),
                    status: stat.SUCCESS
                });
            }).stderr.on('data', function (data) {
                console.log('STDERR: ' + data);
                callback({
                    command,
                    host,
                    stderr: data,
                    status: stat.FAILED
                });
            });
        });
    }).connect(get_connection(username, host, password, privatekey, port));
}

function scp(callback, src_file, dst_file, username, host, password = null, privatekey = null, port = 22) {
    var conn = new Client();
    conn.on('ready', function () {
        console.log('Client :: ready');
        conn.sftp(function (err, sftp) {
            if (err) {
                callback({
                    src_file,
                    host,
                    stderr: err.message.toString('utf8'),
                    status: stat.FAILED
                });
            }
            debugger;
            sftp.fastPut(src_file, dst_file, function (err) {
                if (err) callback({
                    src_file,
                    host,
                    stderr: err.message.toString('utf8'),
                    status: stat.FAILED
                });

                console.log('done');
                conn.end();
                callback(undefined, {
                    src_file,
                    host,
                    stdout: 'done'.toString('utf8'),
                    status: stat.SUCCESS
                });


            });
        });
    }).connect(get_connection(username, host, password, privatekey, port));
}


module.exports.ssh = sshcommand;
module.exports.scp = scp;