require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const http = require('http').createServer(app);
const router = require('./routes/index');

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const io = require('socket.io')(http);

io.on("connection",socket => {
    console.log(socket);
})

mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true})
    .then(()=>console.log("Connected to database"))
    .catch(err => console.log(`Your error:${err}`));

const PORT = process.env.PORT || 5000;

router(app);

http.listen(PORT,()=>console.log(`Connect to port :${PORT}`));


