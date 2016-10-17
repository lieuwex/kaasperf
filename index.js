#!/usr/bin/env node

const PORT=8080;


const express=require("express"),
      hbs=require("hbs"),
      sqlite3=require("sqlite3"),
      bodyParser=require("body-parser"),
      multer=require("multer")(),
      util=require("util");

const app=express();

require("./hbs_helpers")(hbs);

app.set("view engine","html");
app.engine("html",hbs.__express);
app.set("views","client/templates");

//app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.text());

app.use(multer.array());

const db=new sqlite3.Database("db.db");

db.serialize(function(){
	db.run("PRAGMA foreign_keys = ON");
	db.get("SELECT bid FROM benchmarks LIMIT 1",function(err,row){
		if(!err)return;
		db.run("CREATE TABLE benchmarks (bid INTEGER PRIMARY KEY, name TEXT, description TEXT, globalsetup TEXT)");
		db.run("CREATE TABLE tests (tid INTEGER PRIMARY KEY, bid INTEGER REFERENCES benchmarks (bid), name TEXT, setup TEXT, testcode TEXT, teardown TEXT)");
	});
});

function verifyTest(test){
	return typeof test.name=="string"&&typeof test.setup=="string"&&
	       typeof test.testcode=="string"&&typeof test.teardown=="string"&&
	       test.name.length>0&&test.testcode.length>0;
}

function verifyBenchmark(b){
	return typeof b.name=="string"&&typeof b.description=="string"&&
	       typeof b.globalsetup=="string"&&typeof b.tests=="string"&&
	       b.name.length>0&&b.description.length>0&&
	       Array.isArray(b.tests)&&b.tests.length>0&&b.tests.reduce((a,b)=>a&&verifyTest(b),true);
}

function addBenchmark(b){
	db.serialize(function(){
		db.run("INSERT INTO benchmarks (name, description, globalsetup) VALUES (?,?,?)",b.name,b.description,b.globalsetup);
		console.log("Benchmark added...");
		db.get("SELECT last_insert_rowid() AS bid",function(err,row){
			for(test of tests){
				db.run("INSERT INTO tests (bid, name, setup, testcode, teardown) VALUES (?,?,?,?)",row.bid,b.setup,b.testcode,b.teardown);
				console.log("Test added...");
			}
		});
		console.log("Benchmark add done");
	});
}

function getBenchmark(pubid,cb){
	console.log("Benchmark get "+pubid);
	pubid=+pubid;
	if(isNaN(pubid)||pubid<=0)cb(null);
	db.serialise(function(){
		//db.get("SELECT name, description, globalsetup FROM benchmarks WHERE ")
	});
}


app.use(function(req,res,next){
	console.log(req.method+" "+req.originalUrl+" "+util.inspect(req.body));
	next();
});

app.get("/",function(req,res){
	res.redirect("/submit");
});

app.get("/submit",function(req,res){
	res.render("edit",{create:true});
});

app.post("/create",function(req,res){
	const bench={
		name:req.body.name,
		description:req.body.description,
		globalsetup:req.body.globalsetup,
		tests:req.body.tests
	};
	if(!verifyBenchmark(bench)){
		console.log("Benchmark verify failed");
		res.status(400).redirect("/submit");
		return;
	}
	const [pubid,privid]=addBenchmark(bench);
	res.redirect("/"+pubid);
});

app.use("/js",express.static("client/js"));

app.get("/:pubid",function(req,res){
	const pubid=req.params.id;
	getBenchmark(pubid,function(bench){
		if(typeof bench!="number"){
			res.status(404).redirect("/");
			return;
		}
		res.render("benchmark",{publicId:pubid});
	});
});


app.listen(PORT,function(){
	var host=this.address().address;
	var port=this.address().port;
	console.log("Server listening at http://"+host+":"+port);
});
