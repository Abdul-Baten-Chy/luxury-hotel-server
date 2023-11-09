
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000


// middleware
app.use(cors({
  origin: [
       'http://localhost:5173',
       'http://localhost:5174',
  ],
  
  credentials: true,
  optionSuccessStatus:200,
}));
app.use(express.json());
app.use(cookieParser());



const secrete='11360cf50d5112f27a42922f272a6c11145cd45d1d784a41cc4c4e2e8f7d9810b84ec6609fcda47f45dd7d19ff186eef5771ce0f3f8a7a389e0156c3b7aedf0e'
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.yjorklr.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, secrete , (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      next();
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const dataCollection = client.db("hotelData").collection("rooms");
    const userCollection = client.db("hotelData").collection("users");
  
    //  all the get api goes here
    app.get('/rooms', async(req, res)=>{
       const cursor = dataCollection.find();
       const result = await cursor.toArray();
       res.send(result)

    })

    app.get('/rooms/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await dataCollection.findOne(query);
      res.send(result)

   })

   app.get('/bookings', async(req,res)=>{
    const user =req.query?.email;
    // console.log('token', req.cookies.token);
    const query = {user:req.query?.email}
    const result =await userCollection.find(query).toArray()
    res.send(result)
   })

  //  jwt goes here

  app.post('/jwt', async(req,res)=>{
      
    const user = req.body;
    const token = jwt.sign(user,secrete, {expiresIn:'1h'})
    res
    .cookie('token', token, {httpOnly:true, secure:false})
    .send({success:true})
  })

  app.post('/bookings', async(req, res)=>{
    user=req.body;
    const result = await userCollection.insertOne(user)
    res.send(result)
  })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})