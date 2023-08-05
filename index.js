const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware

app.use(cors());
app.use(express.json());

// mongoDB Start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bqstehg.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db("SpeedyWheel").collection("users");
        const carCollection = client.db("SpeedyWheel").collection("cars");
        
        // user related api
        app.post("/users", async(req , res) => {
            const user = req.body;
            const query = { email: user.email}
            const existingUser = await userCollection.findOne(query);
            if(existingUser){
                return res.send({ message: 'user already exists'})
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // cars model related api
        app.get('/cars', async(req, res) =>{
            const result = await carCollection.find().toArray();
            res.send(result)
        })
 
        // specific cars api
        app.get('/cars/:carModel', async(req, res) =>{
            const carName = req.params.carModel;
            // console.log(carName);
            const query = {model: carName}
            const result = await carCollection.findOne(query)
            // console.log(result);
            res.send(result);
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


// server start
app.get('/', (req, res) => {
    res.send("SpeedyWheel's server is running")
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})