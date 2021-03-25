const express = require('express');
const app = express();
var mysql = require('mysql');
var ejs = require("ejs");
const path=require('path');
const bodyParser = require('body-parser');
const { type } = require('os');
const port = 3000;


app.use(express.static(path.join(__dirname,'static')));

app.use(bodyParser.urlencoded({extended: false}))

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'banking_system'
  })

  connection.connect(function(err){
    if(err) throw err;
    console.log("connected");
  })

 app.get('/',(req,res)=>{
    res.render('index.ejs');
 })

 app.get('/customers',(req,res)=>{
    sql1="select Name FROM customers"
    sql2="select Bank_Balance FROM customers"
    sql3="select Account_Number FROM customers"
    connection.query(sql1,function(err,name){
        connection.query(sql2,function(err,balance){
            connection.query(sql3,function(err,AccNo){
          res.render('customers',{name, balance, AccNo})
            })
        })
    })
 })

 app.post('/customer',(req,res)=>{
     var p=req.body.passing;
     sql1='select Name,Email,Bank_Balance FROM customers where Account_Number='+p;
     connection.query(sql1,function(err,data){
       if(req.query.s){
        res.render('customer',{accno:p,name:data[0].Name,email:data[0].Email,balance:data[0].Bank_Balance,pas:req.query.s});
       }
       else{
        res.render('customer',{accno:p,name:data[0].Name,email:data[0].Email,balance:data[0].Bank_Balance});
       }
        app.set('acc', p);
     })      
 })


 app.post('/transfer',(req,res)=>{
   var pas=req.body.transfer;
   sql1='select Name,Email,Bank_Balance FROM customers where Account_Number='+pas;
   sql2='select Account_Number,Name FROM customers where Account_Number!='+pas;
     connection.query(sql1,function(err,data){
      connection.query(sql2,function(err,data2){
        if(req.query.send){
          res.render('transfer',{accno:pas,name:data[0].Name,email:data[0].Email,balance:data[0].Bank_Balance,datas:data2,passed:req.query.send});
        }
        else{
        res.render('transfer',{accno:pas,name:data[0].Name,email:data[0].Email,balance:data[0].Bank_Balance,datas:data2});
        }
     })
    })
 })

app.post('/payment',(req,res)=>{
  var to=req.body.receipent;
  var amount=req.body.amount;
  var accno=req.body.transfer;
  if(to=="" || to==undefined){
    var sel="Choose the receipient to transfer fund"
    res.redirect(307,`/transfer?send=${sel}`);
  }
  else if(amount==""){
      var sel="Please Enter the amount"
      res.redirect(307,`/transfer?send=${sel}`);
  }
  else if(isNaN(amount)){
    var sel="Enter amount of the format (100,1000,etc)"
    res.redirect(307,`/transfer?send=${sel}`);
}
else if(amount==0){
  var sel="Amount cannot be zero"
  res.redirect(307,`/transfer?send=${sel}`);
}
  else if(accno==""){
    var sel="Something went wrong restart"
    res.redirect(307,`/transfer?send=${sel}`);
}
  else{
    sql1='select Bank_Balance FROM customers where Account_Number='+accno;
    connection.query(sql1,function(err,data){
      if(amount>=data[0].Bank_Balance){
        var sel="You have Insufficient Funds in your account"
        res.redirect(307,`/transfer?send=${sel}`);
      }
      else{
        sql1='select Name FROM customers where Account_Number='+to;
        connection.query(sql1,function(err,data){
        app.set('to', to);
        app.set('amount', amount);
        app.set('accno', accno);
        app.set('name', data[0].Name);
        res.render("confirm",{to,amount,accno,name:data[0].Name})
        })
      }
    })
  }
})

app.post('/status',(req,res)=>{
  var tos= app.get('to');
  var amounts= app.get('amount');
  var accnos= app.get('accno');
  var names= app.get('name');
  if(tos==""||amounts==""||accnos==""||names==""||tos==undefined||amounts==undefined||accnos==undefined||names==undefined){
  res.redirect('/')
  }else{
    sql1='select Bank_Balance,Name FROM customers where Account_Number='+tos;
    sql2='select Bank_Balance,Name FROM customers where Account_Number='+accnos;
    connection.query(sql1,function(err,data1){
      connection.query(sql2,function(err,data2){
        var receiver=data1[0].Bank_Balance;
        var sender=data2[0].Bank_Balance;
        var sender=sender-amounts;
        var receiver=Number(receiver)+Number(amounts);
        var sql1 = "insert into transfer_table values('"+ tos+"','"+ data1[0].Name+"','"+ amounts+"',0,'"+ receiver+"')";
        var sql2 = "insert into transfer_table values('"+ accnos+"','"+ data2[0].Name+"',0,'-"+amounts+"','"+ sender+"')";
        var sql3 = "update customers set Bank_Balance= '"+receiver+"' where Account_Number="+tos;
        var sql4 = "update customers set Bank_Balance= '"+sender+"' where Account_Number="+accnos;
        connection.query(sql1,function(err){
          if(err) throw err;
          connection.query(sql2,function(err){
            if(err) throw err;
            connection.query(sql3,function(err){
            if(err) throw err;
              connection.query(sql4,function(err){
            if(err) throw err;
              res.render('payment', {tos,amounts,names,receiver,accnos});
              app.set('to', undefined);
              app.set('amount', undefined);
              app.set('accno', undefined);
              app.set('name', undefined); 
          })
        }) 
      })
    })
  })
})
}

})

app.get('/transactions',(req,res)=>{
    var accno1=app.get('acc');
    sql1='select Name,Credit,Debit,Balance FROM transfer_table where Account_Number='+accno1;
    connection.query(sql1,function(err,data){
      connection.query("select Name FROM customers where Account_Number="+accno1,function(err,data1){
      console.log(data)  
      if(data.length==0)
        {
          res.render("transaction1",{acc:accno1,name:data1[0].Name})
        }
        else
        {
          res.render('transaction',{data,acc:accno1,name:data1[0].Name});
        }
      })
    })
})


  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })

