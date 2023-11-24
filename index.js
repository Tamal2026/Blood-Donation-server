const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Add this line to parse JSON requests

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@try-myself.0cjln25.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const UserCollection = client.db("BloodDonation").collection("Users");

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = {email:user.email}
        const existingUser = await UserCollection.findOne(query);

        if(existingUser){
          return res.send({message:'user already exists',insertedId:null})
        }
        const result = await UserCollection.insertOne(user);
        res.json({ insertedId: result.insertedId }); // Send the insertedId in the response
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blood Donation server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
