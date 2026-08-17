const mongoose = require('mongoose');

// Set mongoose mode to strict and deactive auto indexing
mongoose.set('strictQuery', true);
mongoose.set('autoIndex', false);

const connectDB = async() => {
    try {
        // Use a default MongoDB URI if not provided in environment
        const dbUri = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017/wildpvp';
        
        const conn = await mongoose.connect(dbUri, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
