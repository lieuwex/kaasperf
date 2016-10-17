module.exports=function(hbs){
	hbs.registerHelper("tern",function(cond,a,b){
		return cond?a:b;
	});
};
