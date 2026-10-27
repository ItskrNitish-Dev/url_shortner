import express from "express";
import userRouter from './routes/user.routes.js';
import { authMiddleware } from "./middlewares/auth.middleware.js";
import urlRouter from "./routes/url.routes.js";
import 'dotenv/config.js';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(express.json());
app.use(authMiddleware);

app.get("/", (req, res) => {
    return res.json({message: 'Welcome to URL Shortener Service' });
});


app.use('/user', userRouter);
app.use(urlRouter);


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});