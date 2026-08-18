const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.set('autoIndex', false);

function mongoUri() {
    return (
        process.env.DATABASE_URI ||
        process.env.DATABASE_URL ||
        process.env.MONGODB_URI ||
        process.env.MONGO_URL ||
        ''
    ).trim();
}

const connectDB = async() => {
    try {
        const dbUri = mongoUri() || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/wildpvp');
        if (!dbUri) {
            throw new Error(
                'DATABASE_URI is missing on this Railway service. Open alluring-adventure → Variables → add DATABASE_URI = your mongodb+srv://... Atlas URL, then Redeploy. Shared/frontend variables do not apply here.'
            );
        }
        if (dbUri.includes('127.0.0.1') || dbUri.includes('localhost')) {
            console.warn('Mongo is pointed at localhost. That will not work on Railway.');
        }

        const conn = await mongoose.connect(dbUri, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            serverSelectionTimeoutMS: 15000
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
