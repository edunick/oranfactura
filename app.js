var express = require('express');
var mongoose = require('mongoose');
var bodyParser= require('body-parser');
var multer= require('multer');
var uploader=multer({dest:"./uploads"});
var middleware_upload = uploader.single('image_avatar');
var cloudinary= require('cloudinary');
var method_override = require("method-override");
var app=express();
var app_password="123456";
var Schema = mongoose.Schema;
cloudinary.config({
	cloud_name:"edunick",
	api_key:"474188343919174",
	api_secret:"isD_HqzwrFco6jlDzQD3hrqDJYA"
});

mongoose.connect("mongodb://localhost/primera_pagina");

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended:true}));

var productSchemaJSON= {
	title:String,
	description:String,
	imageUrl:String,
	pricing:Number
};
var productSchema = new Schema(productSchemaJSON);
productSchema.virtual("image.url").get(function(){
	if(this.imageUrl==="" || this.imageUrl==="default.jpg" || this.imageUrl==="data.png"){
		return "default.png";
	}
	return this.imageUrl;
});
var Product = mongoose.model("Product",productSchema);

app.set("view engine","pug");

app.use(express.static("public"));
app.use(method_override("_method"));
app.get("/",function(req,res){// solicitud, respuesta	
	res.render("index");
});

app.get("/menu/new",function(req,res){
	res.render("menu/new");
});

app.get("/menu",function(req,res){
	Product.find(function(error,documento){
			//console.log(documento);
			res.render("menu/index",{products:documento});
	});
});

app.post("/menu",middleware_upload,function(req,res){
	var data={
		title:req.body.title,
		description:req.body.description,
		imageUrl:"default.jpg",
		pricing:req.body.pricing
	}
	var product = new Product(data);
	if(req.file){
		cloudinary.uploader.upload(req.file.path, 
			function(result) { 
				product.imageUrl=result.url;			
				product.save(function(err){				
					res.redirect("/");
				});
		});
	}else{
		product.save(function(err){				
					res.redirect("/");
				});
	}
});


app.get("/admin",function(req,res){
	res.render("admin/form");
});

app.post("/admin",function(req,res){
	if(req.body.password==app_password){
		Product.find(function(error,documento){
				res.render("admin/index",{products:documento});
		});
	}else{
		res.redirect("/");
	}
});

app.put("/menu/:id",middleware_upload,function(req,res){
	var data={
		title:req.body.title,
		description:req.body.description,		
		pricing:req.body.pricing
	};
	if(req.file){
		cloudinary.uploader.upload(req.file.path, 
			function(result) { 
				data.imageUrl=result.url;			
				Product.update({"_id": req.params.id},data,function(product){		
					res.redirect("/menu");
				});
		});
	}
	
	
});
app.get("/menu/edit/:id",function(req,res){
	var id_producto = req.params.id;
	Product.findOne({"_id": id_producto},function(error,producto){
		//console.log(producto);
		res.render("menu/edit",{product:producto});
	});
});

app.get("/menu/delete/:id",function(req,res){
	var id=req.params.id;
	Product.findOne({"_id":id},function(err,producto){
		res.render("menu/delete",{producto:producto})
	});
});

app.delete("/menu/:id",middleware_upload,function(req,res){
	Product.remove({"_id":req.params.id},function(err){
		if(err){console.log(err);}
		res.redirect("/menu");
	});

});

app.listen(8080);