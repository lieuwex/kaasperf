#!/usr/bin/env node

const app=require("express")(),
      hbs=require("hbs"),
      sqlite3=require("sqlite3"),
      bodyParser=require("body-parser");

require("./hbs_helpers")(hbs);

const PORT=8080;

app.set("view engine","html");
app.engine("html",hbs.__express);
app.set("views","client/templates");

app.use(bodyParser.urlencoded({extended:true}));

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
		db.get("SELECT last_insert_rowid() AS bid",function(err,row){
			for(test of tests){
				db.run("INSERT INTO tests (bid, name, setup, testcode, teardown) VALUES (?,?,?,?)",row.bid,b.setup,b.testcode,b.teardown);
			}
		});
	});
}


app.get("/",function(req,res){
	res.redirect("/submit");
});

app.get("/submit",function(req,res){
	res.render("edit",{edit:false});
});

app.post("/create",function(req,res){
	const bench={name:req.name,description:req.description,globalsetup:req.globalsetup,tests:req.tests};
	if(!verifyBenchmark(bench)){
		res.status(400).redirect("/submit");
	} else {
		const [pubid,privid]=addBenchmark(bench);
		res.redirect("/"+pubid);
	}
});


app.listen(PORT,function(){
	var host=this.address().address;
	var port=this.address().port;
	console.log("Server listening at http://"+host+":"+port);
});
