import { log } from "console";
import express, { urlencoded } from "express";
import path from "path";
import { fileURLToPath } from "url";

// Enterance
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({extended: true}));
app.use(express.json());


// View
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');


// Routes
app.get("/", (req, res)=>{
    res.render("index");
});
app.get("/download", (req, res)=>{
    
    console.log(req.query.link);
    res.send("Done");
});

export default app;