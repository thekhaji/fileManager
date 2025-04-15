function downloadMergedFile(link){
    axios.post("/download/merged", {link: link}).then(response => {
        console.log(response);
    }).catch(error => {
        console.log(error);
    });
}

function downloadSeparatedFile(link){
    axios.post("/download/separated", {link: link}).then(response => {
        console.log(response);
    }).catch(error => {
        console.log(error);
    });
}
