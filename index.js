import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import db from "./config/Database.js";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import TicketRoute from "./routes/TicketRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import ProductProjectRoute from "./routes/ProductProjectRoute.js";
import TicketResponseRoute from "./routes/TicketResponseRoute.js";
import ReportRoute from "./routes/ReportRoute.js"

dotenv.config();

const app = express();

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
    db: db
});

// (async()=>{
//     await db.sync();
// })();

(async () => {
    try {
        // Sync all models to create tables
        await db.sync();
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
})();

app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: 'auto'
    }
}));

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));
app.use(express.json());
app.use(UserRoute);
app.use(TicketRoute);
app.use(ProductProjectRoute);
app.use(AuthRoute);
app.use(TicketResponseRoute);
app.use(ReportRoute);

store.sync();

app.listen(process.env.APP_PORT, ()=> {
    console.log('Server up and running...');
});
