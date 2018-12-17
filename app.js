const restify = require('restify');
const error = require('restify-errors');
// const plugin = require('restify').plugins;
const fs = require('fs');
const stat = require('./infra/status.js');

var del_file = (filename) => {
    fs.unlink(filename, (err) => {
        if (err) {
            console.log(err);
            return {
                filename,
                action: "delete",
                stderr: err.message.toString('utf8'),
                status: stat.FAILED
            }
        } else {
            return {
                filename,
                action: "delete",
                stdout: err.message.toString('utf8'),
                status: stat.SUCCESS
            }
        }
    });
}


const {
    ssh,
    scp
} = require('./handler/SSH/handler.js');
const port = process.env.PORT || 3000;

const server = restify.createServer({
    name: `rest2ssh`

});

server.use(restify.plugins.bodyParser());

server.pre((req, res, next) => {
    console.info(`${req.method} - ${req.url}`);
    return next();

});
server.post('/command', (req, res, next) => {
    if (!(req.body && req.body.command &&
            req.body.host && req.body.username)) return next(new error.BadRequestError("Missing params"));
    var vmport = req.body.port || 22;
    if (req.body.key) {
        ssh((err, data) => {
            if (err) {
                return next(new error.NotAcceptableError(err));
            } else {
                res.send(200, data);
                return next(data);
            }
        }, req.body.command, req.body.username, req.body.host, undefined, req.body.key, vmport);
    }
});

server.put('/upload', (req, res, next) => {
    // console.log(req.files);
    if (!(req.body && req.body.dstfilename &&
            req.body.host && req.body.username)) return next(new error.BadRequestError("Missing params"));
    var vmport = req.body.port || 22;
    for (var key in req.files) {
        if (req.files.hasOwnProperty(key)) {
            fs.renameSync(req.files[key].path, `${__dirname}/uploads/${req.files[key].name}`, (err) => {
                if (err) throw err;
            });

            scp((err, data) => {
                    if (err) {
                        del_file(`${__dirname}/uploads/${req.files[key].name}`);
                        return next(new error.NotAcceptableError(err));
                    } else {
                        res.send(201, data);
                        del_file(`${__dirname}/uploads/${req.files[key].name}`);
                        next();
                    }
                },
                `${__dirname}/uploads/${req.files[key].name}`, req.body.dstfilename,
                req.body.username, req.body.host,
                req.body.password, req.body.key, vmport);


        }
    }
    // res.send(202, {
    //     message: `${req.files[key].name} File uploaded`
    // });
});


server.listen(port, () => {
    console.info(`api running on port ${port}`);

});