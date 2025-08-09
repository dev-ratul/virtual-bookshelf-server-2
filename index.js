
// 

const express = require('express');
const app = express();
const cors = require('cors');
const { ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dakbubs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db('virtualBook');
    const bookCollection = db.collection('addBook');
    const reviewCollection = db.collection('reviews');
    const usersCollection = db.collection('users');
    const specialOffer= db.collection('specialOffer');

    // Existing routes....

    app.post('/addBook', async (req, res) => {
      const result = await bookCollection.insertOne(req.body);
      res.send(result);
    });

    app.get('/addBook', async (req, res) => {
      const result = await bookCollection.find().toArray();
      res.send(result);
    });

    app.get('/addBook/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch('/addBook/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { upvote: 1 } }
      );
      res.send(result);
    });

    // add special offer
    app.post('/add-special-offer', async (req, res)=>{
      const result = await specialOffer.insertOne(req.body);
      res.send(result);
    })

    app.get('/special-offer', async (req, res)=>{
      const result= await specialOffer.find().limit(8).toArray()
      res.send(result);
    })

    app.get('/getuserbook', async (req, res) => {
      const email = req.query.email;
      const result = await bookCollection.find({ user_email: email }).toArray();
      res.send(result);
    });

    app.get('/editBook/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.put('/updateBook/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      res.send(result);
    });

    app.delete('/delete/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get('/popularBook', async (req, res) => {
      const result = await bookCollection.find().sort({ upvote: -1 }).limit(8).toArray();
      res.send(result);
    });

    app.get('/popularBook/:id', async (req, res) => {
      const id = req.params.id;
      const result = await bookCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    app.get('/reviews/:bookId', async (req, res) => {
      const bookId = req.params.bookId;
      const result = await reviewCollection.find({ bookId }).toArray();
      res.send(result);
    });

    app.post('/reviews', async (req, res) => {
      const { bookId, userEmail } = req.body;
      const existing = await reviewCollection.findOne({ bookId, userEmail });
      if (existing) return res.status(400).send({ error: 'Already reviewed' });

      const result = await reviewCollection.insertOne(req.body);
      res.send(result);
    });

    app.patch('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const { review } = req.body;
      const result = await reviewCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { review } }
      );
      res.send(result);
    });

    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const result = await reviewCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // New PATCH route for reading_status update
    app.patch('/books/:id/reading-status', async (req, res) => {
      const id = req.params.id;
      const { reading_status } = req.body;

      const validStatuses = ["Want-to-Read", "Reading", "Read"];
      if (!validStatuses.includes(reading_status)) {
        return res.status(400).send({ error: "Invalid reading status" });
      }

      try {
        const result = await bookCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { reading_status } }
        );

        if (result.modifiedCount > 0) {
          res.send({ success: true, modifiedCount: result.modifiedCount });
        } else {
          res.status(404).send({ error: "Book not found or status unchanged" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update reading status" });
      }
    });

    // Stats and top reviewers routes...
    app.get("/api/stats", async (req, res) => {
      try {
        const bookCount = await bookCollection.countDocuments();
        const userCount = await usersCollection.countDocuments();
        const reviewCount = await reviewCollection.countDocuments();
        res.send({ bookCount, userCount, reviewCount });
      } catch (err) {
        res.status(500).send({ error: "Failed to fetch stats" });
      }
    });

    app.get("/api/top-reviewers", async (req, res) => {
      try {
        const pipeline = [
          {
            $group: {
              _id: "$userEmail",
              totalReviews: { $sum: 1 }
            }
          },
          { $sort: { totalReviews: -1 } },
          { $limit: 3 }
        ];
        const topReviewers = await reviewCollection.aggregate(pipeline).toArray();
        res.send(topReviewers);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch top reviewers" });
      }
    });

    // await client.db("admin").command({ ping: 1 });

    console.log("✅ Connected to MongoDB!");
  } finally {
    // Optionally: client.close()
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Virtual Bookshelf Server Running');
});

app.listen(3000, () => {
  console.log(`📚 Server listening on port 3000`);
});
