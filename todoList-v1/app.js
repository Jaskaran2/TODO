const mongoose = require("mongoose");
const express=require("express");
const bodyParser=require("body-parser");
const _ =require("lodash");

const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");
//-----------------------------------------------------------------------------------------------------------------------------

//Database connection
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true});

//creating schema
const itemsSchema=new mongoose.Schema({
  name:{
    type:String,
    //Adding constraint
    required:[true,"Please check no name specified"]
  }
});

//Creating model
const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Welcome to do list"
});

const item2=new Item({
  name:"Hit + button to add a new item"
});

const item3=new Item({
  name:"<-- Hit this to delete the item"
});
//-----------------------------------------------------------------------------------------------------------------------

const defaultItems=[item1,item2,item3];

//A new list schema
const listSchema=new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});


const List=mongoose.model("List", listSchema)

//--------------------------------------------------------------------------------------------------------------------

// Daily to do list section

app.get("/",function(req,res){

  //Reading from your database
  Item.find({},function(err,foundItems){

    if(foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }
      else{
        console.log("Successfully saved the default items");
      }
      });
      res.redirect("/");
    }
    else{
      res.render("list",{listTitle:"Today",newListItems:foundItems});

    }
  });
});
//------------------------------------------------------------------------------------------------------------



//custom path :Dynamic route
app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //create new lis
      const list = new List({
        name:customListName,
        items:defaultItems
      });

      list.save();
      res.redirect("/"+customListName);
    }

      else{
        //show an existing list
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    }
  });
});


//-----------------------------------------------------------------------------------------------------------------


//posting new item to home route
app.post("/",function(req,res){
  const itemName=req.body.item;
  const listName=req.body.list;

  const item=new Item({
    name:itemName
  });

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else {

    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});
//----------------------------------------------------------------------------------------------------------------


//delete items
app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
    if(!err){
      console.log("Successfully deleted checked item");
      res.redirect("/");
    }
  });
}
else{
  //Pull from items array where the id corresponds to checkedItemId
  List.findOneAndUpdate({name:listName},{$pull: {items:{_id: checkedItemId}}},function(err,foundList){
    if(!err){
      res.redirect("/"+listName);
    }
  });
}
});
//---------------------------------------------------------------------------------------------------------------------------


//About

app.get("/about",function(req,res){
  res.render("about");
});


// Local and global host

app.listen(process.env.PORT || 3000,function(){
  console.log("Server up and running");
});
//-----------------------------------------------------------------------------------------------------------------------------
