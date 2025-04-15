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

controller.downloadMergedFile = async (req, res) => {
    try {
        console.log("Downloading merged file");
        console.log("req.url:", req.body);

        let files;
        try {
            files = JSON.parse(req.body.files);
        } catch (e) {
            throw new Error("Invalid files data format");
        }
        console.log("Request files:", files);

        if (!files || !Array.isArray(files)) {
            throw new Error("Invalid request: files array is required");
        }


        await serviceModel.mergedDownload({ files }, res);

    } catch (error) {
        console.log("Error, while downloading:", error);
        res.send("Error while downloading from provided links");
    }
}

controller.downloadSeparatedFile = async(req, res) => {
    try {
        console.log("Separate download request received");
        let files;
        try {
            files = JSON.parse(req.body.files);
        } catch (e) {
            throw new Error("Invalid files data format");
        }
        console.log("Request files:", files);
        
        if (!files || !Array.isArray(files)) {
            throw new Error("Invalid request: files array is required");
        }
        
        await serviceModel.seperateDownload({ files }, res);
    } catch (error) {
        console.error("Separate download error:", error);
        res.status(500).json({ error: error.message || "Error while downloading separated file" });
    }
}



export default controller;
