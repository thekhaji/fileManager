import ServiceModel from "../models/service.model.js";

const controller = {};
const serviceModel = new ServiceModel();

controller.getMainPage = (req, res) => {
    try {
        console.log("Main page");
        res.render("index");
    } catch (err) {
        console.log("Error, main page:", err);
        res.send("Error while rendering the page");
    }
};

controller.getFiles = async (req, res) =>{
    try {
        console.log("Download Page");
        const links = req.query.link;
        const result = await serviceModel.getFiles(links);
        
        res.render("download", {results: result});
    } catch (error) {
        console.log("Error, while downloading:", error);
        res.send("Error while downloading from provided links");
    }
}

controller.downloadMergedFile = (req, res) => {
    console.log("Downloading merged file");
    res.send("Downloading merged file");
}

controller.downloadSeparatedFile = (req, res) => {
    console.log("Downloading separated file");
    res.send("Downloading separated file");
}



export default controller;
