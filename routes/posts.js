var express = require('express');
var mysql = require('mysql');
var aws = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');
var db_config = require('../config/db_config.json');
var router = express.Router();

aws.config.loadFromPath('./config/aws_config.json');

var s3 = new aws.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket:'soptjjam',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop());
    }
  })
});


var pool = mysql.createPool({
  host : db_config.host,
  port : db_config.port,
  user : db_config.user,
  password : db_config.password,
  database : db_config.database,
  connectionLimit : db_config.connectionLimit
});


router.get('/', function(req, res, next) {
  pool.getConnection(function(error, connection){
    if (error){
      console.log("getConnection Error" + error);
      res.sendStatus(500);
    }
    else{
      connection.query('select * from post order by id desc', function(error, rows){
        if (error){
          console.log("Connection Error" + error);
          res.sendStatus(500);
          connection.release();
        }
        else {
          res.status(200).send({result : rows});
          connection.release();
        }
      });
    }
  });
});

router.get('/:id', function(req, res, next) {
  pool.getConnection(function(error, connection){
    if (error){
      console.log("getConnection Error" + error);
      res.sendStatus(500);
    }
    else{
      connection.query('select * from post where id = ?', [req.params.id], function(error, rows){
        if (error){
          console.log("Connection Error" + error);
          res.sendStatus(500);
          connection.release();
        }
        else {
          res.status(200).send({result : rows[0]});
          connection.release();
        }
      });
    }
  });
});


router.post('/', upload.single('image'), function(req, res, next) {
  pool.getConnection(function(error, connection){
    if (error){
      console.log("getConnection Error" + error);
      res.sendStatus(500);
    }
    else{
      var sql, inserts;
      if (req.file){
        sql = 'insert into post(title, contents, image_url) values(?,?,?)';
        inserts = [req.body.title, req.body.contents, req.file.location];
      }
      else {
        sql = 'insert into post(title, contents) values(?,?)';
        inserts = [req.body.title, req.body.contents];
      }
      connection.query(sql, inserts, function(error, rows){
        if (error){
          console.log("Connection Error" + error);
          res.sendStatus(500);
          connection.release();
        }
        else {
          res.status(201).send({result : 'create'});
          connection.release();
        }
      });
    }
  });
});






module.exports = router;
