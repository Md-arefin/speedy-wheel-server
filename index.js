const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)

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
        // await client.connect();

        const userCollection = client.db("SpeedyWheel").collection("users");
        const carCollection = client.db("SpeedyWheel").collection("cars");
        const rentalCollection = client.db("SpeedyWheel").collection("rented-cars");
        const paymentCollection = client.db("SpeedyWheel").collection('payments');

        // user related api
        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // cars model related api
        app.get('/cars', async (req, res) => {
            const result = await carCollection.find().toArray();
            res.send(result)
        })

        // specific cars api
        app.get('/cars/:carModel', async (req, res) => {
            const carName = req.params.carModel;
            // console.log(carName);
            const query = { model: carName }
            const result = await carCollection.findOne(query)
            // console.log(result);
            res.send(result);
        })

        // save data for car rent
        app.post("/cart-rent", async (req, res) => {
            const carRent = req.body;
            // console.log(carRent);
            const result = await rentalCollection.insertOne(carRent)
            res.send(result)
        })

        // get booking data with email
        app.get("/booked/:email", async (req, res) => {
            const user = req.params.email;
            const query = { email: user };
            const result = await rentalCollection.find(query).toArray();
            res.send(result)
        })

        // get booking data with id
        app.get("/car-booked/:id", async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { _id: new ObjectId(id) };
            const result = await rentalCollection.find(query).toArray();
            res.send(result)
        })

        // create payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseFloat(price * 100).toFixed(0);
            // console.log(price,"amount", amount)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        // payment related api
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const query = { _id: new ObjectId(payment._id)};
            const deleteResults = await rentalCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/rented-car/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/rented-car/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await paymentCollection.find(query).sort()
            res.send(result);
        })

        app.delete('/rented-car/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const query = { _id: new ObjectId(id) };
            const result = await rentalCollection.deleteOne(query);
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