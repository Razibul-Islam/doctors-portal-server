const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5jjbyfi.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const appointmentOptionCollection = client
      .db("doctorsPortal")
      .collection("appointmentOptions");
    const bookingsCollection = client
      .db("doctorsPortal")
      .collection("bookings");

    // Use Aggregate to query multiple collection and then merge data
    app.get("/doctorsAppointmentOptions", async (req, res) => {
      const date = req.query.date;
      // console.log(date);
      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();
      // Get the bookings of the provided date
      const bookingQuery = { appointmentDate: date };
      const alreadyBooked = await bookingsCollection
        .find(bookingQuery)
        .toArray();
      // console.log(alreadyBooked);
      options.forEach((option) => {
        // console.log(option);
        const optionBook = alreadyBooked.filter(
          (book) => book.treatment === option.name
        );
        const bookedSlots = optionBook.map((book) => book.slot);

        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        // console.log(optionBook);
        // console.log(option.name, date, remainingSlots.length);
        option.slots = remainingSlots;
        // console.log(option.slots);
      });
      res.send(options);

      /**
       * API Naming Convention
       * app.get("/bookings")
       * app.get("/bookings/:id")
       * app.post("/bookings")
       * app.patch("/bookings/:id")
       * app.delete("/bookings/:id")
       */

      app.post("/bookings", async (req, res) => {
        const booking = req.body;
        console.log(booking);

        const query = {
          appointmentDate: booking.appointmentDate,
          treatment: booking.treatment,
          email: booking.email,
        };
        console.log(query);

        const alreadyBooked = await bookingsCollection.find(query).toArray();

        if (alreadyBooked.length) {
          // console.log(alreadyBooked);
          const message = `You already have a booking on ${booking.appointmentDate}`;
          return res.send({ acknowledged: false, message });
        }

        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
      });
    });
  } finally {
  }
}
run().catch(console.error);

app.get("/", (req, res) => {
  res.send("doctors portal server is running");
});

app.listen(port, () => {
  console.log(`${port} port is running`);
  // client.connect((err) => {
  //   console.error(err);
  // });
});
