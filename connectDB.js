const { mongoose } = require('mongoose')

const connectDB = async () => {
  try {
    const x = await mongoose.connect('mongodb+srv://denesg:chebu997@cluster0.mcn7j6b.mongodb.net/MyDatabase?retryWrites=true&w=majority')
    console.log("Connected to db");
    mongoose.connection.db.dropDatabase();
    console.log("Dropped db");
    // get the data from Github 
  } catch (error) {
    console.log('db error');
  }
}

module.exports = { connectDB }