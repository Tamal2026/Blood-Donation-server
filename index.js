const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
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
    const DonatedBloodCollection = client
      .db("BloodDonation")
      .collection("DonatedBlood");
      const blogsCollection = client.db('BloodDonation').collection('Blogs')

  

      // jwt apply
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // MiddleWares
    const verifyToken = (req, res, next) => {
      console.log("inside Verify token ", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Forbidden Access" });
      }
      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    // For all users Admin DashBoard
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      console.log(req.headers);
      const query = req.body;
      const result = await UserCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/Blogs", async (req, res) => {
      console.log(req.headers);
      const query = req.body;
      const result = await blogsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access" });
      }
      const query = { email: email };
      const user = await UserCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.get('/users/admin/:email',verifyToken, async (req,res)=>{
      const email = req.params.email;
      const query = {email : email}
      const result= UserCollection.findOne(query)
      res.send(result)
    })

    
    app.post("/bloodDonation", async (req, res) => {
      const bloodDonation = req.body;
      const result = await DonatedBloodCollection.insertOne(bloodDonation);
      res.send(result);
    });
    app.post("/Blogs", async (req, res) => {
      const Blogs = req.body;
      const result = await blogsCollection.insertOne(Blogs);
      res.send(result);
    });

    app.get("/bloodDonation/:email", async (req, res) => {
      const userEmail = req.params.email;

      try {
        // Assuming 'email' is a field in your 'DonatedBloodCollection'
        const query = { email: userEmail };

        // Find all blood donation records for the given email
        const result = await DonatedBloodCollection.find(query).toArray();

        res.json(result);
      } catch (error) {
        console.error("Error fetching blood donation data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.post("/users", async (req, res) => {
     
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await UserCollection.findOne(query);

        if (existingUser) {
          return res.send({ message: "user already exists", insertedId: null });
        }
        const result = await UserCollection.insertOne(user);
        res.json({ insertedId: result.insertedId });
     
    });

    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await UserCollection.deleteOne(query);
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await UserCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

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
