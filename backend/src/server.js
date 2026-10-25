require('dotenv').config();require('./app').listen(process.env.PORT||4000,()=>console.log('API running on port '+(process.env.PORT||4000)));
